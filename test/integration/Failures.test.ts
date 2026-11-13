import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CommandDispatcher } from "../../src/cli/CommandDispatcher.js";
import { CliCommands } from "../../src/cli/CliCommands.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";
import { SvgWriter } from "../../src/infrastructure/SvgWriter.js";
import { MemoryStore } from "../support/MemoryStore.js";

test("every applicable course error preserves document, redo, path and IO lock", async () => {
  const factory = new ShapeFactory();
  const files = new MemoryStore();
  const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), files);
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  for (const command of ["create g x", "tree", "show x", "help", "undo", "save"]) {
    assert.equal((await dispatcher.execute(command)).error, "no document. use 'init' or 'read' first");
  }
  for (const command of ["init", "create g scene", "create rect r 0 0 10 10 in scene", "move r 2 3", "undo"]) {
    assert.equal((await dispatcher.execute(command)).error, undefined);
  }
  const before = session.state();
  const cases = [
    ["create g r", "id already exists: r"],
    ["delete r9", "no such shape: r9"],
    ["create g nope in node9", "no such container: node9"],
    ["create g nope in r", "not a container: r"],
    ["create hexagon h", "unknown shape type: hexagon (is the plugin loaded?)"],
    ["group bad scene r", "cannot group a container into its own descendant: scene"],
    ["ungroup scene", "cannot ungroup top-level container: scene"],
    ["scale r -1", "scale factor must be positive"],
    ["read missing.svg", "cannot read file: missing.svg"],
    ["set r bad value", "unknown attribute: bad"],
  ] as const;
  for (const [command, expected] of cases) {
    assert.equal((await dispatcher.execute(command)).error, expected, command);
    assert.deepEqual(session.state(), before, command);
  }
  for (const command of [
    "init 0 10", "canvas 10 NaN", "move r 1 Infinity", "scale r NaN", "create rect bad 0 0 -1 1",
    "group bad r r", "addto scene scene", "create text bad 1 2 \"broken", 'create g "two words"',
  ]) {
    assert.ok((await dispatcher.execute(command)).error, command);
    assert.deepEqual(session.state(), before, command);
  }
  files.failWrites = true;
  assert.equal((await dispatcher.execute("save fail.svg")).error, "cannot write file: fail.svg");
  assert.deepEqual(session.state(), before);
  files.contents.set("invalid.svg", '<svg><g/><rect id="dup"/><circle id="dup"/></svg>');
  const invalid = await dispatcher.execute("read invalid.svg");
  assert.equal(invalid.error, "id already exists: dup");
  assert.equal(invalid.warnings, undefined);
  assert.deepEqual(session.state(), before);
  assert.equal((await dispatcher.execute("redo")).error, undefined);
});

test("failed edits never unlock an IO barrier and nested overflow rolls back every child", async () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  await dispatcher.execute("init");
  await dispatcher.execute("create g scene");
  await dispatcher.execute("create rect small 1 2 3 4 in scene");
  await dispatcher.execute("create circle huge 1e308 1 1 in scene");
  const before = session.state();
  assert.ok((await dispatcher.execute("scale scene 10")).error);
  assert.deepEqual(session.state(), before);
  await dispatcher.execute("canvas 400 300");
  const blocked = session.state();
  assert.ok((await dispatcher.execute("delete missing")).error);
  assert.deepEqual(session.state(), blocked);
  assert.equal((await dispatcher.execute("undo")).error, "undo not allowed after io command");
  await dispatcher.execute("move small 1 0");
  await dispatcher.execute("undo");
  assert.equal((await dispatcher.execute("undo")).error, "nothing to undo");
});
