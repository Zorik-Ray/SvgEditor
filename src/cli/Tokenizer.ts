export interface Token {
  readonly value: string;
  readonly quoted: boolean;
}

export class Tokenizer {
  tokenize(line: string): readonly Token[] {
    if (line.trimStart().startsWith("#")) return [];
    const tokens: Token[] = [];
    let value = "";
    let insideQuotes = false;
    let quoted = false;
    let started = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index]!;
      const next = line[index + 1];
      if (insideQuotes && character === "\\" && next === '"') {
        value += next;
        index++;
        continue;
      }
      if (character === '"') {
        insideQuotes = !insideQuotes;
        quoted = true;
        started = true;
      } else if (/\s/.test(character) && !insideQuotes) {
        if (started) tokens.push({ value, quoted });
        value = "";
        quoted = false;
        started = false;
      } else {
        value += character;
        started = true;
      }
    }
    if (insideQuotes) throw new Error("unterminated double quote");
    if (started) tokens.push({ value, quoted });
    return tokens;
  }
}
