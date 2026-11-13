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

test("tree includes geometry, subtree queries and show expose details without touching history", async () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  for (const command of ["init", "create g scene", 'create text title 20 40 "My Diagram" in scene']) {
    assert.equal((await dispatcher.execute(command)).error, undefined);
  }
  const before = session.state();
  assert.deepEqual((await dispatcher.execute("tree")).output, [
    "svg (800x600)", "└── g#scene", '    └── text#title (20,40) "My Diagram"',
  ]);
  assert.deepEqual((await dispatcher.execute("tree title")).output, ['text#title (20,40) "My Diagram"']);
  assert.deepEqual((await dispatcher.execute("show title")).output,
    ["text#title  parent=g#scene", "  x=20", "  y=40", '  text="My Diagram"']);
  const help = (await dispatcher.execute("help")).output.join("\n");
  for (const command of ["init", "canvas", "create", "delete", "move", "scale", "set", "group", "ungroup",
    "addto", "front", "back", "tree", "show", "help", "undo", "redo"]) assert.match(help, new RegExp(`^${command}\\b`, "m"));
  assert.deepEqual(session.state(), before);
});

test("all six create types accept in and editing commands preserve failure state", async () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  await dispatcher.execute("init");
  await dispatcher.execute("create g scene");
  const commands = [
    "create rect r 1 2 3 4 #fff in scene",
    "create circle c 1 2 3 in scene",
    "create ellipse e 1 2 3 4 in scene",
    "create line l 1 2 3 4 black in scene",
    'create text t 1 2 "in scene" in scene',
    "create g nested in scene",
    "move scene 1 2",
    "scale scene 2",
    'set t text ""',
    "front r", "back r", "addto nested r", "ungroup nested",
    "group pair c e", "undo", "redo", "delete pair", "undo",
  ];
  for (const command of commands) assert.equal((await dispatcher.execute(command)).error, undefined, command);
  const before = session.state();
  const errors = [
    ["create rect r 0 0 1 1", "id already exists: r"],
    ["move missing 1 2", "no such shape: missing"],
    ["scale r 0", "scale factor must be positive"],
    ["set r opacity 0.5", "unknown attribute: opacity"],
    ["create box n1", "unknown shape type: box (is the plugin loaded?)"],
    ["create g nope in r", "not a container: r"],
    ["create g nope in missing", "no such container: missing"],
    ["ungroup scene", "cannot ungroup top-level container: scene"],
  ] as const;
  for (const [command, expected] of errors) {
    assert.equal((await dispatcher.execute(command)).error, expected, command);
    assert.deepEqual(session.state(), before, command);
  }
});
