import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { FileStore } from "../application/ports/FileStore.js";

export class NodeFileStore implements FileStore {
  async read(file: string): Promise<string> {
    try {
      return await readFile(file, "utf8");
    } catch {
      throw new Error(`cannot read file: ${file}`);
    }
  }

  async write(file: string, content: string): Promise<void> {
    const target = resolve(file);
    const temporary = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
      await rename(temporary, target);
    } catch {
      await unlink(temporary).catch(() => {});
      throw new Error(`cannot write file: ${file}`);
    }
  }
}
