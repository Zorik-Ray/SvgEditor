import type { FileStore } from "../../src/application/ports/FileStore.js";

export class MemoryStore implements FileStore {
  readonly contents = new Map<string, string>();
  failWrites = false;
  async read(file: string): Promise<string> {
    const content = this.contents.get(file);
    if (content === undefined) throw new Error(`cannot read file: ${file}`);
    return content;
  }
  async write(file: string, content: string): Promise<void> {
    if (this.failWrites) throw new Error(`cannot write file: ${file}`);
    this.contents.set(file, content);
  }
}
