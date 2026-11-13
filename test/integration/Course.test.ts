import assert from "node:assert/strict";
import { test } from "node:test";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { CliHarness } from "../support/CliHarness.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";

test("the exact course session continues after expected errors and reads seven imported elements", async () => {
  const directory = await mkdtemp(join(tmpdir(), "svg-editor-course-"));
  try {
    await copyFile(resolve("examples/other.svg"), join(directory, "other.svg"));
    const result = await CliHarness.run(await readFile("examples/session.txt", "utf8"), directory);
    assert.equal(result.status, 0);
    assert.equal(result.errors, [
      "error: cannot group a container into its own descendant: markers",
      "error: undo not allowed after io command",
      "warning: assigned id rect1 to unnamed <rect>",
      "",
    ].join("\n"));
    assert.match(result.output, /saved to demo.svg \(5 elements\)/);
    assert.match(result.output, /read other.svg \(7 elements\)/);
    assert.match(result.output, /svg \(400x300\)/);
    assert.match(result.output, /rect#rect1 x=0 y=0 w=400 h=300 fill=#ffffff/);
    assert.doesNotMatch(result.output, /svg>/);
    const saved = new SvgReader(new ShapeFactory()).decode(await readFile(join(directory, "demo.svg"), "utf8")).document;
    assert.equal(saved.find("title").toRecord().text, "My Diagram");
    assert.equal(saved.find("c1").toRecord().attributes.cx, "130");
    assert.equal(saved.parentOf("box")?.id, "markers");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the course flowchart produces eight elements with restored node position and updated Chinese label", async () => {
  const directory = await mkdtemp(join(tmpdir(), "svg-editor-flow-"));
  try {
    const result = await CliHarness.run(await readFile("examples/flowchart.txt", "utf8"), directory);
    assert.equal(result.status, 0);
    assert.equal(result.errors, "");
    assert.match(result.output, /saved to flowchart.svg \(8 elements\)/);
    const svg = await readFile(join(directory, "flowchart.svg"), "utf8");
    const saved = new SvgReader(new ShapeFactory()).decode(svg).document;
    assert.equal(saved.count, 8);
    assert.equal(saved.find("process").toRecord().attributes.y, "100");
    assert.equal(saved.find("process-label").toRecord().text, "处理数据 v2");
    assert.deepEqual(saved.find("flowchart").children.map((shape) => shape.id), ["node1", "node2", "arrow1"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
