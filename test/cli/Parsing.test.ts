import assert from "node:assert/strict";
import { test } from "node:test";
import { Tokenizer } from "../../src/cli/Tokenizer.js";
import { CommandDispatcher } from "../../src/cli/CommandDispatcher.js";

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
