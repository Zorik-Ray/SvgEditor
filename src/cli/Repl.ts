import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { LineExecutor } from "../application/LineExecutor.js";

export class Repl {
  constructor(
    private readonly executor: LineExecutor,
    private readonly input: Readable = process.stdin,
    private readonly output: Writable = process.stdout,
    private readonly errors: Writable = process.stderr,
    private readonly interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
  ) {}

  async run(): Promise<void> {
    const lines = createInterface({
      input: this.input,
      output: this.output,
      terminal: this.interactive,
      crlfDelay: Infinity,
    });
    let interrupted = false;
    const interrupt = (): void => {
      interrupted = true;
      lines.close();
    };
    lines.on("SIGINT", interrupt);
    process.on("SIGINT", interrupt);
    try {
      if (this.interactive) {
        this.output.write("svg-editor 0.1 — use 'init' or 'read' to begin\n");
        lines.setPrompt("svg> ");
        lines.prompt();
      }
      for await (const line of lines) {
        if (interrupted) break;
        const result = await this.executor.execute(line);
        for (const message of result.output) this.output.write(`${message}\n`);
        for (const warning of result.warnings ?? []) this.errors.write(`${warning}\n`);
        if (result.error) this.errors.write(`error: ${result.error}\n`);
        if (this.interactive) lines.prompt();
      }
    } finally {
      process.off("SIGINT", interrupt);
      lines.close();
    }
  }
}
