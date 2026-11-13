import type { LineExecutor, LineResult } from "../application/LineExecutor.js";
import { Arguments } from "./Arguments.js";
import { Tokenizer } from "./Tokenizer.js";

interface CommandEntry {
  readonly syntax: string;
  readonly withoutDocument: boolean;
  readonly run: (arguments_: Arguments) => LineResult | Promise<LineResult>;
}

export class CommandDispatcher implements LineExecutor {
  private readonly commands = new Map<string, CommandEntry>();
  private readonly tokenizer = new Tokenizer();

  constructor(private readonly requireDocument: () => void = () => {}) {}

  register(name: string, entry: CommandEntry): void {
    if (this.commands.has(name)) throw new Error(`command already registered: ${name}`);
    this.commands.set(name, entry);
  }

  syntaxes(): readonly string[] {
    return [...this.commands.values()].map((entry) => entry.syntax);
  }

  async execute(line: string): Promise<LineResult> {
    try {
      const [name, ...tokens] = this.tokenizer.tokenize(line);
      if (!name) return { output: [] };
      const entry = this.commands.get(name.value);
      if (!entry?.withoutDocument) this.requireDocument();
      if (!entry) throw new Error(`unknown command: ${name.value}`);
      return await entry.run(new Arguments(tokens, entry.syntax));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { output: [], error: message.replace(/[\r\n]+/g, " ") };
    }
  }
}
