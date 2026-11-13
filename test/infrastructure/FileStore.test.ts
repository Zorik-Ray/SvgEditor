import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { NodeFileStore } from "../../src/infrastructure/NodeFileStore.js";

test("file store reads, atomically replaces, and cleans up failed writes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "svg-editor-files-"));
  const store = new NodeFileStore();
  try {
    const target = join(directory, "含 空格.svg");
    await store.write(target, "first");
    await store.write(target, "second");
    assert.equal(await store.read(target), "second");
    assert.equal(await readFile(target, "utf8"), "second");
    await assert.rejects(store.read(join(directory, "missing.svg")), /cannot read file:/);
    const folder = join(directory, "folder");
    await mkdir(folder);
    await assert.rejects(store.write(folder, "bad"), /cannot write file:/);
    assert.deepEqual((await readdir(directory)).sort(), ["folder", "含 空格.svg"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
