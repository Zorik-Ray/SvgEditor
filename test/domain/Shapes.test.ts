import assert from "node:assert/strict";
import { test } from "node:test";
import { Rect } from "../../src/domain/Rect.js";
import { Circle } from "../../src/domain/Circle.js";
import { Ellipse } from "../../src/domain/Ellipse.js";
import { Line } from "../../src/domain/Line.js";
import { Text } from "../../src/domain/Text.js";

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

test("ellipse, line and text implement their own geometry and text rules", () => {
  const ellipse = new Ellipse("ellipse", 10, 20, 3, 4);
  ellipse.move(1, 2);
  ellipse.scale(2);
  assert.deepEqual(ellipse.toRecord().attributes, { id: "ellipse", cx: "22", cy: "44", rx: "6", ry: "8" });
  const line = new Line("line", 1, 2, 3, 4);
  line.move(2, -2);
  assert.deepEqual(line.toRecord().attributes, { id: "line", x1: "3", y1: "0", x2: "5", y2: "2" });
  const text = new Text("label", 10, 20, "开始");
  text.set("text", "处理数据 v2");
  assert.equal(text.clone().toRecord().text, "处理数据 v2");
  assert.throws(() => line.set("text", "bad"), /unknown attribute: text/);
  assert.throws(() => text.set("font-size", "20"), /unknown attribute/);
});
