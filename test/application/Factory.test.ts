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
