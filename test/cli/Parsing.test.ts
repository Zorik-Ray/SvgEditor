import assert from "node:assert/strict";
import { test } from "node:test";
import { Tokenizer } from "../../src/cli/Tokenizer.js";
import { CommandDispatcher } from "../../src/cli/CommandDispatcher.js";
import { CliCommands } from "../../src/cli/CliCommands.js";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { SvgReader } from "../../src/infrastructure/SvgReader.js";
import { SvgWriter } from "../../src/infrastructure/SvgWriter.js";
import { MemoryStore } from "../support/MemoryStore.js";

test("tokenizer preserves quoted text, empty strings, colors and Windows paths", () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('create text t 1 2 "开始 in node"').map((token) => token.value),
    ["create", "text", "t", "1", "2", "开始 in node"]);
  assert.deepEqual(tokenizer.tokenize('set t text ""').at(-1), { value: "", quoted: true });
  assert.equal(tokenizer.tokenize("create rect r 0 0 1 1 #fff").at(-1)?.value, "#fff");
  assert.equal(tokenizer.tokenize('read "D:\\my files\\demo.svg"').at(-1)?.value, "D:\\my files\\demo.svg");
  assert.equal(tokenizer.tokenize('set t text "say \\"hi\\""').at(-1)?.value, 'say "hi"');
  assert.deepEqual(tokenizer.tokenize("  # comment"), []);
  assert.throws(() => tokenizer.tokenize('"broken'), /unterminated double quote/);
});

test("dispatcher validates argument count and reports one-line errors", async () => {
  const dispatcher = new CommandDispatcher();
  dispatcher.register("echo", {
    syntax: "echo <value>",
    withoutDocument: true,
    run: (arguments_) => ({ output: [arguments_.count(1).at(0)] }),
  });
  assert.deepEqual(await dispatcher.execute('echo "hello world"'), { output: ["hello world"] });
  assert.equal((await dispatcher.execute("echo")).error, "usage: echo <value>");
  assert.equal((await dispatcher.execute("unknown")).error, "unknown command: unknown");
});

test("quoted Windows network paths and literal backslashes retain their exact characters", () => {
  const tokenizer = new Tokenizer();
  assert.equal(tokenizer.tokenize(String.raw`read "\\server\my share\demo.svg"`).at(-1)?.value,
    String.raw`\\server\my share\demo.svg`);
  assert.equal(tokenizer.tokenize(String.raw`set t text "two \\ slashes"`).at(-1)?.value,
    String.raw`two \\ slashes`);
});

test("read and save pass quoted network paths to the file store unchanged", async () => {
  const factory = new ShapeFactory();
  const files = new MemoryStore();
  const source = String.raw`\\server\共享 目录\source.svg`;
  const target = String.raw`\\server\共享 目录\copy.svg`;
  files.contents.set(source, '<svg><rect id="r" width="10" height="20"/></svg>');
  const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), files);
  const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
  new CliCommands(dispatcher, session);
  assert.equal((await dispatcher.execute(`read "${source}"`)).error, undefined);
  assert.equal(session.state().sourcePath, source);
  assert.equal((await dispatcher.execute("set r fill red")).error, undefined);
  assert.equal((await dispatcher.execute(`save "${target}"`)).error, undefined);
  assert.match(files.contents.get(target)!, /fill="red"/);
  assert.equal((await dispatcher.execute("save")).error, undefined);
  assert.match(files.contents.get(source)!, /fill="red"/);
});
