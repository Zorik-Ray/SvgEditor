import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";
import { SvgWriter } from "../../src/infrastructure/SvgWriter.js";

import { MemoryStore } from "../support/MemoryStore.js";

test("file operations commit document, path and history only on success", async () => {
  const factory = new ShapeFactory();
  const files = new MemoryStore();
  const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), files);
  session.init();
  session.create("rect", "r", ["0", "0", "10", "10"]);
  session.undo();
  const before = session.state();
  await assert.rejects(session.read("missing.svg"), /cannot read file: missing.svg/);
  files.contents.set("invalid.svg", '<svg><circle id="bad" r="-1"/></svg>');
  await assert.rejects(session.read("invalid.svg"));
  files.failWrites = true;
  await assert.rejects(session.save("fail.svg"), /cannot write file: fail.svg/);
  assert.deepEqual(session.state(), before);
  session.redo();
  files.failWrites = false;
  await session.save("demo.svg");
  assert.throws(() => session.undo(), /undo not allowed after io command/);
  session.move("r", "1", "2");
  session.undo();
  assert.throws(() => session.undo(), /nothing to undo/);
  files.contents.set("source.svg", '<svg width="400" height="300"><rect width="10" height="10"/></svg>');
  const imported = await session.read("source.svg");
  assert.deepEqual(imported.warnings, ["warning: assigned id rect1 to unnamed <rect>"]);
  session.set("rect1", "fill", "red");
  await session.save();
  assert.match(files.contents.get("source.svg")!, /fill="red"/);
  assert.equal(session.state().sourcePath, "source.svg");
  await session.save("copy.svg");
  assert.equal(session.state().sourcePath, "source.svg");
});

test("root ID collisions fail atomically after read and preserve the current history segment", async () => {
  const factory = new ShapeFactory();
  const files = new MemoryStore();
  const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), files);
  files.contents.set("root.svg", '<svg id="canvas"><rect id="r"/><circle id="c"/></svg>');
  await session.read("root.svg");
  const blocked = session.state();
  assert.throws(() => session.create("g", "canvas", []), /id already exists: canvas/);
  assert.deepEqual(session.state(), blocked);
  session.move("r", "1", "2");
  session.undo();
  const before = session.state();
  assert.throws(() => session.group("canvas", ["r", "c"]), /id already exists: canvas/);
  assert.deepEqual(session.state(), before);
  session.redo();
  await session.save();
  assert.equal(new SvgReader(factory).decode(files.contents.get("root.svg")!).document.count, 2);
  files.contents.set("generated.svg", '<svg id="rect1"><rect/></svg>');
  assert.deepEqual((await session.read("generated.svg")).warnings,
    ["warning: assigned id rect2 to unnamed <rect>"]);
});

test("unrepresentable imported transforms preserve the existing document, source path and redo", async () => {
  const factory = new ShapeFactory();
  const files = new MemoryStore();
  const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), files);
  files.contents.set("source.svg", '<svg><rect id="r"/></svg>');
  await session.read("source.svg");
  session.move("r", "10", "20");
  session.undo();
  const before = session.state();
  for (const transform of ["scale(1e-200) scale(1e-200)", "scale(1e200) scale(1e200)"]) {
    files.contents.set("invalid.svg", `<svg><g id="g" transform="${transform}"><rect/></g></svg>`);
    await assert.rejects(session.read("invalid.svg"));
    assert.deepEqual(session.state(), before);
  }
  session.redo();
  assert.equal(session.state().document?.children[0]?.attributes.x, "10");
});
