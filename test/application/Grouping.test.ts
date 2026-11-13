import assert from "node:assert/strict";
import { test } from "node:test";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { Group } from "../../src/domain/Group.js";
import { Rect } from "../../src/domain/Rect.js";
import { HistoryManager } from "../../src/application/HistoryManager.js";
import { GroupCommand } from "../../src/application/commands/GroupCommand.js";
import { UngroupCommand } from "../../src/application/commands/UngroupCommand.js";
import { AddToCommand } from "../../src/application/commands/AddToCommand.js";
import { FrontCommand } from "../../src/application/commands/FrontCommand.js";
import { BackCommand } from "../../src/application/commands/BackCommand.js";

test("group retains original order across parents and undo restores all positions", () => {
  const document = new SvgDocument();
  const history = new HistoryManager();
  document.insert(new Group("left"));
  document.insert(new Group("right"));
  document.insert(new Rect("a", 1, 2, 3, 4), "left");
  document.insert(new Rect("b", 5, 6, 7, 8), "right");
  const before = document.toRecord();
  history.execute(new GroupCommand("both", ["b", "a"]), document);
  assert.deepEqual(document.find("both").children.map((child) => child.id), ["a", "b"]);
  assert.deepEqual(document.children.map((child) => child.id), ["both", "left", "right"]);
  history.undo();
  assert.deepEqual(document.toRecord(), before);
  history.redo();
  assert.equal(document.count, 5);
});

test("front and back only reorder siblings and are exactly reversible", () => {
  const document = new SvgDocument();
  const history = new HistoryManager();
  document.insert(new Group("scene"));
  for (const id of ["a", "b", "c"]) document.insert(new Rect(id, 0, 0, 1, 1), "scene");
  const before = document.toRecord();
  history.execute(new FrontCommand("a"), document);
  assert.deepEqual(document.find("scene").children.map((child) => child.id), ["b", "c", "a"]);
  history.execute(new BackCommand("c"), document);
  assert.deepEqual(document.find("scene").children.map((child) => child.id), ["c", "b", "a"]);
  history.undo();
  history.undo();
  assert.deepEqual(document.toRecord(), before);
  history.redo();
  assert.equal(document.parentOf("a")?.id, "scene");
});

test("ungroup expands in place, addto appends, and illegal hierarchies are rejected atomically", () => {
  const document = new SvgDocument();
  const history = new HistoryManager();
  document.insert(new Group("scene"));
  document.insert(new Group("nested"), "scene");
  document.insert(new Rect("a", 0, 0, 1, 1), "nested");
  document.insert(new Rect("b", 0, 0, 1, 1), "scene");
  const before = document.toRecord();
  for (const command of [
    new GroupCommand("bad", ["scene", "a"]),
    new GroupCommand("bad", ["a", "a"]),
    new UngroupCommand("scene"),
    new AddToCommand("nested", "scene"),
  ]) {
    assert.throws(() => history.execute(command, document));
    assert.deepEqual(document.toRecord(), before);
  }
  history.execute(new UngroupCommand("nested"), document);
  assert.deepEqual(document.find("scene").children.map((child) => child.id), ["a", "b"]);
  history.undo();
  assert.deepEqual(document.toRecord(), before);
  history.execute(new AddToCommand("nested", "b"), document);
  assert.deepEqual(document.find("nested").children.map((child) => child.id), ["a", "b"]);
});
