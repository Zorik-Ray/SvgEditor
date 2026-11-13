import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";

test("SVG reader imports nested shapes, text content and nonconflicting generated IDs", () => {
  const result = new SvgReader(new ShapeFactory()).decode(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
      <text id="t1" x="10" y="290">imported &amp; 中文</text>
      <circle id="c1" cx="50" cy="50" r="10"/>
      <g id="g1"><rect id="rect1" width="10" height="10"/><circle id="c2" cx="5" cy="5" r="2"/></g>
      <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
    </svg>`);
  assert.equal(result.document.count, 7);
  assert.equal(result.document.width, 400);
  assert.deepEqual(result.warnings, ["warning: assigned id rect2 to unnamed <rect>"]);
  assert.equal(result.document.find("t1").toRecord().text, "imported & 中文");
  assert.equal(result.document.parentOf("rect1")?.id, "g1");
});

test("invalid XML, duplicate IDs and unsupported shape types are rejected", () => {
  const reader = new SvgReader(new ShapeFactory());
  for (const source of [
    "<svg><rect></svg>",
    '<svg><g id="a"/><circle id="a"/></svg>',
    "<svg><path d=\"M0 0\"/></svg>",
    "<html/>",
    '<svg viewBox="0 0 0 20"/>',
  ]) assert.throws(() => reader.decode(source), source);
});
