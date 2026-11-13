import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { SvgWriter } from "../../src/infrastructure/SvgWriter.js";

test("SVG output preserves order, namespace, missing styles and escaped text", () => {
  const factory = new ShapeFactory();
  const document = new SvgDocument(400, 200);
  document.insert(factory.create("g", "scene", []));
  document.insert(factory.create("rect", "r", ["0", "0", "100", "50"]), "scene");
  document.insert(factory.create("text", "t", ["10", "20", '开始 < & "End" 😀']), "scene");
  const output = new SvgWriter().encode(document);
  assert.match(output, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(output, /viewBox="0 0 400 200"/);
  assert.match(output, /<rect id="r" x="0" y="0" width="100" height="50"\/>/);
  assert.match(output, /开始 &lt; &amp; "End" 😀<\/text>/);
  assert.ok(output.indexOf('<rect id="r"') < output.indexOf('<text id="t"'));
  assert.doesNotMatch(output, /fill=/);
});
