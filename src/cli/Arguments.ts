import type { Token } from "./Tokenizer.js";

export class Arguments {
  constructor(readonly tokens: readonly Token[], private readonly syntax: string) {}

  count(minimum: number, maximum = minimum): this {
    if (this.tokens.length < minimum || this.tokens.length > maximum) throw new Error(`usage: ${this.syntax}`);
    return this;
  }

  at(index: number): string {
    const token = this.tokens[index];
    if (!token) throw new Error(`usage: ${this.syntax}`);
    return token.value;
  }

  values(): string[] {
    return this.tokens.map((token) => token.value);
  }
}
