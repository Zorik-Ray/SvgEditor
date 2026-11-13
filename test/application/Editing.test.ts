import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { HistoryManager } from "../../src/application/HistoryManager.js";
import { CreateCommand } from "../../src/application/commands/CreateCommand.js";
import { DeleteCommand } from "../../src/application/commands/DeleteCommand.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { MoveCommand } from "../../src/application/commands/MoveCommand.js";
import { ScaleCommand } from "../../src/application/commands/ScaleCommand.js";
import { SetCommand } from "../../src/application/commands/SetCommand.js";

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

test("geometry and property undo restore exact values and absent attributes", () => {
  const factory = new ShapeFactory();
  const history = new HistoryManager();
  const document = new SvgDocument();
  document.insert(factory.create("rect", "r", ["0.1", "0.2", "3", "4"]));
  const before = document.toRecord();
  history.execute(new MoveCommand("r", 0.2, 0.3), document);
  history.execute(new ScaleCommand("r", 1.1), document);
  history.execute(new SetCommand("r", "fill", "red"), document);
  history.undo();
  assert.equal(document.find("r").toRecord().attributes.fill, undefined);
  history.undo();
  history.undo();
  assert.deepEqual(document.toRecord(), before);
  const state = history.status;
  assert.throws(() => history.execute(new SetCommand("r", "text", "bad"), document), /unknown attribute: text/);
  assert.deepEqual(history.status, state);
});
