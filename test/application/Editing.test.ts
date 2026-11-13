import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { HistoryManager } from "../../src/application/HistoryManager.js";
import { CreateCommand } from "../../src/application/commands/CreateCommand.js";
import { DeleteCommand } from "../../src/application/commands/DeleteCommand.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

test("creation in a container and subtree deletion each form one undo unit", () => {
  const factory = new ShapeFactory();
  const history = new HistoryManager();
  const document = new SvgDocument();
  history.execute(new CreateCommand(factory, "g", "scene", []), document);
  history.execute(new CreateCommand(factory, "rect", "r", ["1", "2", "3", "4"], "scene"), document);
  const before = document.toRecord();
  history.execute(new DeleteCommand("scene"), document);
  assert.equal(document.count, 0);
  assert.equal(history.undo(), "g#scene restored into svg");
  assert.deepEqual(document.toRecord(), before);
  history.redo();
  assert.equal(document.count, 0);
});
