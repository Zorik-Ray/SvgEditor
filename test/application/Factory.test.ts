import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";

test("one factory creates all six types from CLI and SVG records", () => {
  const factory = new ShapeFactory();
  const cases: readonly [string, readonly string[]][] = [
    ["rect", ["1", "2", "3", "4", "#fff"]],
    ["circle", ["1", "2", "3"]],
    ["ellipse", ["1", "2", "3", "4"]],
    ["line", ["1", "2", "3", "4", "black"]],
    ["text", ["1", "2", "开始 < & \""]],
    ["g", []],
  ];
  for (const [type, parameters] of cases) {
    const shape = factory.create(type, `id-${type}`, parameters);
    assert.deepEqual(factory.fromRecord(shape.toRecord()).toRecord(), shape.toRecord());
  }
  assert.throws(() => factory.create("box", "n1", []), /unknown shape type: box \(is the plugin loaded\?\)/);
  assert.throws(() => factory.create("rect", "r", ["1", "2"]), /invalid parameters/);
  assert.throws(() => factory.create("g", "g", ["extra"]), /invalid parameters/);
});

test("shape IDs preserve case and Unicode while rejecting whitespace", () => {
  const factory = new ShapeFactory();
  for (const id of ["node A", "node\tA", "node\nA", "node\rA"]) {
    assert.throws(() => factory.create("g", id, []), /id must not contain whitespace/);
  }
  for (const id of ["node-A", "Node-A", "节点-1", "1"]) {
    assert.equal(factory.create("g", id, []).id, id);
  }
});

test("set allows exactly the shared and per-type attribute whitelist", () => {
  const factory = new ShapeFactory();
  const cases: readonly [string, readonly string[], readonly string[]][] = [
    ["rect", ["0", "0", "10", "20"], ["x", "y", "width", "height"]],
    ["circle", ["0", "0", "10"], ["cx", "cy", "r"]],
    ["ellipse", ["0", "0", "10", "20"], ["cx", "cy", "rx", "ry"]],
    ["line", ["0", "0", "10", "20"], ["x1", "y1", "x2", "y2"]],
    ["text", ["0", "0", "label"], ["x", "y", "text"]],
    ["g", [], []],
  ];
  const candidates = ["x", "y", "width", "height", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2", "text"];
  for (const [type, parameters, allowed] of cases) {
    const shape = factory.create(type, type, parameters);
    shape.set("fill", "red");
    shape.set("stroke", "black");
    shape.set("stroke-width", "0.5");
    for (const attribute of candidates) {
      if (allowed.includes(attribute)) shape.set(attribute, "2");
      else assert.throws(() => shape.set(attribute, "2"), new RegExp(`unknown attribute: ${attribute}$`), `${type}.${attribute}`);
    }
    for (const attribute of ["id", "opacity", "transform", "font-size"]) assert.throws(() => shape.set(attribute, "2"));
    assert.throws(() => shape.set("stroke-width", "-1"));
  }
});

test("scale multiplies every declared geometry attribute for all leaf types", () => {
  const factory = new ShapeFactory();
  const cases: readonly [string, readonly string[]][] = [
    ["rect", ["1", "2", "3", "4"]], ["circle", ["1", "2", "3"]],
    ["ellipse", ["1", "2", "3", "4"]], ["line", ["1", "2", "3", "4"]],
    ["text", ["1", "2", "content"]],
  ];
  for (const [type, parameters] of cases) {
    const shape = factory.create(type, type, parameters);
    const before = shape.toRecord();
    shape.scale(2);
    for (const [attribute, value] of Object.entries(before.attributes)) {
      if (attribute !== "id") assert.equal(shape.toRecord().attributes[attribute], String(Number(value) * 2), `${type}.${attribute}`);
    }
    assert.equal(shape.toRecord().text, before.text);
  }
});
