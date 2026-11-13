import assert from "node:assert/strict";
import { test } from "node:test";
import { Rect } from "../../src/domain/Rect.js";
import { Circle } from "../../src/domain/Circle.js";

test("rect and circle encapsulate geometry and default appearance", () => {
  const rect = new Rect("box", 10, 20, 30, 40);
  assert.equal(rect.toRecord().attributes.fill, undefined);
  rect.move(-5, 0.5);
  rect.scale(2);
  assert.deepEqual(rect.toRecord().attributes, { id: "box", x: "10", y: "41", width: "60", height: "80" });
  rect.set("fill", "red");
  rect.set("width", "12.5");
  assert.equal(rect.clone().describe(), rect.describe());
  const circle = new Circle("dot", 1, 2, 3);
  circle.scale(2);
  assert.equal(circle.toRecord().attributes.r, "6");
});

test("invalid geometry and unknown attributes fail without changing a shape", () => {
  const rect = new Rect("r", 0, 0, 10, 10);
  const before = rect.toRecord();
  for (const operation of [
    () => rect.set("width", "-1"),
    () => rect.set("opacity", "0.5"),
    () => rect.scale(0),
    () => rect.move(Infinity, 1),
  ]) assert.throws(operation);
  assert.deepEqual(rect.toRecord(), before);
  assert.throws(() => new Circle("c", 0, 0, -1));
});
