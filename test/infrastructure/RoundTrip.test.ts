import assert from "node:assert/strict";
import { test } from "node:test";
import { DOMParser } from "@xmldom/xmldom";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";
import { SvgWriter } from "../../src/infrastructure/SvgWriter.js";
import { Transform } from "../../src/domain/Transform.js";

test("background transform example keeps nested geometry, typography and attributes through round trips", () => {
  const reader = new SvgReader(new ShapeFactory());
  const writer = new SvgWriter();
  const imported = reader.decode(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <g id="diagram" transform="translate(60,40)" fill="blue">
        <rect id="a" x="0" y="0" width="120" height="60" fill="#4a90d9"/>
        <line id="e" x1="120" y1="30" x2="200" y2="30" stroke="black"/>
        <g id="nodeB" transform="translate(200,0) scale(0.8)">
          <rect id="r" x="0" y="0" width="120" height="60" fill="#f5a623"/>
          <text id="label" x="60" y="38" text-anchor="middle" font-size="16" fill="white"> End &amp; 中文 </text>
        </g>
      </g>
    </svg>`);
  const document = imported.document;
  document.find("nodeB").move(0, 100);
  document.find("diagram").scale(2);
  const serialized = writer.encode(document);
  assert.deepEqual(reader.decode(serialized).document.toRecord(), document.toRecord());
  assert.equal(document.find("label").toRecord().attributes["text-anchor"], "middle");
  assert.equal(document.find("label").toRecord().text, " End & 中文 ");
  assert.equal(document.find("r").toRecord().attributes.width, "240");
  assert.throws(() => document.find("label").set("font-size", "20"), /unknown attribute/);
});

test("transform parsing preserves composition order and rejects unsupported operations", () => {
  assert.equal(Transform.parse("scale(2) translate(10 20)").toAttribute(), "translate(20,40) scale(2)");
  for (const value of ["rotate(30)", "scale(2,3)", "translate()", "scale(0)", "translate(1)junk"]) {
    assert.throws(() => Transform.parse(value), value);
  }
});

test("reader never silently drops unrecognized text or nested elements", () => {
  const reader = new SvgReader(new ShapeFactory());
  for (const source of [
    "<svg>lost<rect id=\"r\"/></svg>",
    "<svg><g id=\"g\">lost</g></svg>",
    "<svg><text id=\"t\"><tspan>lost</tspan></text></svg>",
  ]) assert.throws(() => reader.decode(source), source);
  assert.equal(reader.decode('<svg><text id="t">   </text></svg>').document.find("t").toRecord().text, "   ");
});

test("SVG prefixes and inherited attribute namespaces survive saving and reparenting", () => {
  const reader = new SvgReader(new ShapeFactory());
  const writer = new SvgWriter();
  const document = reader.decode(`
    <s:svg xmlns:s="http://www.w3.org/2000/svg" xmlns="urn:other" width="400" height="300">
      <s:g id="scene" xmlns:meta="urn:notes">
        <s:rect id="r" width="4" height="5" meta:note="preserve me"/>
      </s:g>
      <s:g id="target"/>
    </s:svg>`).document;
  document.insert(document.detach("r"), "target");
  const serialized = writer.encode(document);
  const parsed = new DOMParser({
    onError: (_level, message) => { throw new Error(message); },
  }).parseFromString(serialized, "application/xml");
  assert.equal(parsed.documentElement?.namespaceURI, "http://www.w3.org/2000/svg");
  const rectangle = parsed.getElementsByTagName("rect").item(0)!;
  assert.equal(rectangle.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(rectangle.getAttributeNode("meta:note")?.namespaceURI, "urn:notes");
  assert.equal(rectangle.getAttribute("meta:note"), "preserve me");
  assert.deepEqual(reader.decode(serialized).document.toRecord(), document.toRecord());
});
