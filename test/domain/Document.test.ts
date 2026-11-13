import assert from "node:assert/strict";
import { test } from "node:test";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { Group } from "../../src/domain/Group.js";
import { Rect } from "../../src/domain/Rect.js";

test("document maintains nested ID lookup, parents, order and deletion", () => {
  const document = new SvgDocument();
  document.insert(new Group("scene"));
  document.insert(new Rect("r", 0, 0, 10, 20), "scene");
  document.insert(new Rect("R", 0, 0, 1, 1));
  assert.equal(document.count, 3);
  assert.equal(document.parentOf("r")?.id, "scene");
  assert.deepEqual(document.locationOf("r"), { parentId: "scene", index: 0 });
  assert.throws(() => document.insert(new Rect("r", 1, 2, 3, 4)), /id already exists: r/);
  assert.throws(() => document.insert(new Group("a"), "missing"), /no such container/);
  assert.throws(() => document.insert(new Group("a"), "R"), /not a container/);
  document.detach("scene");
  assert.equal(document.count, 1);
  assert.equal(document.has("r"), false);
});

test("document snapshots own an independent graph and reconstruct the index", () => {
  const document = new SvgDocument(400, 300);
  document.insert(new Group("scene"));
  document.insert(new Rect("r", 1, 2, 3, 4), "scene");
  const snapshot = document.clone();
  document.find("r").set("fill", "red");
  document.detach("scene");
  document.restore(snapshot);
  assert.deepEqual(document.toRecord(), snapshot.toRecord());
  assert.equal(document.find("r").toRecord().attributes.fill, undefined);
  document.resize(200, 100);
  assert.equal(snapshot.width, 400);
});

test("composite operations recurse through nested groups without overriding child styles", () => {
  const outer = new Group("outer");
  const inner = new Group("inner");
  const rect = new Rect("r", 10, 20, 30, 40);
  inner.insertChild(rect);
  outer.insertChild(inner);
  outer.set("fill", "blue");
  rect.set("fill", "red");
  outer.move(5, -10);
  outer.scale(2);
  assert.deepEqual(rect.toRecord().attributes, {
    id: "r", x: "30", y: "20", width: "60", height: "80", fill: "red",
  });
  assert.equal(outer.toRecord().attributes.fill, "blue");
  assert.deepEqual(outer.clone().toRecord(), outer.toRecord());
});

test("imported translate and uniform scale survive cloning and geometric edits", () => {
  const group = new Group("node");
  group.importAttributes({ transform: "translate(200,0) scale(0.8)" });
  const rect = new Rect("r", 0, 0, 100, 50);
  group.insertChild(rect);
  group.move(8, 0);
  assert.equal(rect.toRecord().attributes.x, "10");
  group.scale(2);
  assert.equal(rect.toRecord().attributes.x, "20");
  assert.equal(rect.toRecord().attributes.width, "200");
  assert.equal(group.toRecord().attributes.transform, "translate(400,0) scale(0.8)");
  assert.deepEqual(group.clone().toRecord(), group.toRecord());
  assert.throws(() => group.set("transform", "rotate(90)"), /unknown attribute/);
});
