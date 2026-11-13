import type { LineExecutor, LineResult } from "../application/LineExecutor.js";
import { Repl } from "../cli/Repl.js";

class Main implements LineExecutor {
  async execute(line: string): Promise<LineResult> {
    if (!line.trim() || line.trimStart().startsWith("#")) return { output: [] };
    return { output: [], error: "no document. use 'init' or 'read' first" };
  }

  static async run(): Promise<void> {
    await new Repl(new Main()).run();
  }
}

await Main.run();
