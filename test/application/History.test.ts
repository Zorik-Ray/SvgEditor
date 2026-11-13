import assert from "node:assert/strict";
import { test } from "node:test";
import { HistoryManager } from "../../src/application/HistoryManager.js";
import { EditCommand } from "../../src/application/commands/EditCommand.js";
import { Rect } from "../../src/domain/Rect.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

class TestEdit extends EditCommand {
  constructor(private readonly action: (document: SvgDocument) => void) { super(); }
  protected override apply(document: SvgDocument): string {
    this.action(document);
    return "changed";
  }
}

test("history records exact states, clears redo on edits, and honors IO barriers", () => {
  const history = new HistoryManager();
  const document = new SvgDocument();
  history.barrier();
  assert.throws(() => history.undo(), /undo not allowed after io command/);
  history.execute(new TestEdit((target) => target.insert(new Rect("r", 0.1, 0.2, 3, 4))), document);
  const before = document.toRecord();
  history.execute(new TestEdit((target) => target.find("r").scale(1.1)), document);
  const after = document.toRecord();
  history.undo();
  assert.deepEqual(document.toRecord(), before);
  history.redo();
  assert.deepEqual(document.toRecord(), after);
  history.undo();
  history.execute(new TestEdit((target) => target.find("r").set("fill", "red")), document);
  assert.throws(() => history.redo(), /nothing to redo/);
  history.barrier();
  assert.throws(() => history.redo(), /undo not allowed after io command/);
});

test("a partially applied failed edit restores graph and preserves redo", () => {
  const history = new HistoryManager();
  const document = new SvgDocument();
  history.execute(new TestEdit((target) => target.insert(new Rect("r", 0, 0, 1, 1))), document);
  history.undo();
  const before = document.toRecord();
  const state = history.status;
  assert.throws(() => history.execute(new TestEdit((target) => {
    target.insert(new Rect("partial", 0, 0, 1, 1));
    throw new Error("failed");
  }), document), /failed/);
  assert.deepEqual(document.toRecord(), before);
  assert.deepEqual(history.status, state);
  history.redo();
  assert.equal(document.find("r").id, "r");
});
