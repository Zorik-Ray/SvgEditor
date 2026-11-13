import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { CommandDispatcher } from "../../src/cli/CommandDispatcher.js";
import { CliCommands } from "../../src/cli/CliCommands.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CreateCommand } from "../../src/application/commands/CreateCommand.js";

test("init and canvas obey defaults, document guard and history boundaries", async () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  assert.equal((await dispatcher.execute("canvas")).error, "no document. use 'init' or 'read' first");
  assert.deepEqual((await dispatcher.execute("init")).output, ["canvas 800x600 created"]);
  assert.equal((await dispatcher.execute("undo")).error, "undo not allowed after io command");
  session.edit(new CreateCommand(new ShapeFactory(), "g", "scene", []));
  const state = session.state();
  await dispatcher.execute("canvas");
  assert.deepEqual(session.state(), state);
  assert.match((await dispatcher.execute("canvas -1 20")).error!, /must be positive/);
  assert.deepEqual(session.state(), state);
  await dispatcher.execute("canvas 400 300");
  assert.equal(session.state().document?.attributes.width, "400");
  assert.equal((await dispatcher.execute("undo")).error, "undo not allowed after io command");
});
