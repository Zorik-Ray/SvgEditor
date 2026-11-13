import assert from "node:assert/strict";
import { Readable, PassThrough } from "node:stream";
import { test } from "node:test";
import { Repl } from "../../src/cli/Repl.js";

test("REPL awaits each command and continues after a reported error", async () => {
  const output = new PassThrough();
  const errors = new PassThrough();
  const executed: string[] = [];
  await new Repl(
    {
      async execute(line) {
        await Promise.resolve();
        executed.push(line);
        return line === "bad"
          ? { output: [], error: "invalid command" }
          : { output: [line] };
      },
    },
    Readable.from(["first\r\nbad\r\nlast\r\n"]),
    output,
    errors,
    false,
  ).run();
  assert.deepEqual(executed, ["first", "bad", "last"]);
  assert.equal(output.read()?.toString(), "first\nlast\n");
  assert.equal(errors.read()?.toString(), "error: invalid command\n");
});

test("SIGINT stops queued commands and releases its signal listener", async () => {
  const before = process.listenerCount("SIGINT");
  const executed: string[] = [];
  await new Repl(
    {
      async execute(line) {
        executed.push(line);
        process.emit("SIGINT");
        return { output: [] };
      },
    },
    Readable.from(["first\nsecond\nthird\n"]),
    new PassThrough(),
    new PassThrough(),
    false,
  ).run();
  assert.deepEqual(executed, ["first"]);
  assert.equal(process.listenerCount("SIGINT"), before);
});
