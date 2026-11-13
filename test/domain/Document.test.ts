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
