import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { test } from "node:test";

test("source classes and import directions match the declared architecture", async () => {
  const sourceRoot = resolve("src");
  const files = (await readdir(sourceRoot, { recursive: true })).filter((file) => file.endsWith(".ts"));
  for (const file of files) {
    const path = resolve(sourceRoot, file);
    const source = await readFile(path, "utf8");
    const classes = [...source.matchAll(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm)];
    assert.ok(classes.length <= 1, file);
    if (classes.length) assert.equal(classes[0]![1], basename(file, ".ts"), file);
    assert.doesNotMatch(source, /^(?:export\s+)?(?:async\s+)?function\s+/m, file);
    assert.doesNotMatch(source, /\bswitch\s*\(/, file);
    const layer = file.split(/[\\/]/)[0];
    for (const statement of source.matchAll(/\bimport\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g)) {
      const specifier = statement[1]!;
      if (!specifier.startsWith(".")) {
        if (layer === "domain" || layer === "application") assert.fail(`external dependency in ${file}: ${specifier}`);
        continue;
      }
      const targetLayer = relative(sourceRoot, resolve(dirname(path), specifier)).split(/[\\/]/)[0];
      if (layer === "domain") assert.equal(targetLayer, "domain", file);
      if (layer === "application") assert.ok(["domain", "application"].includes(targetLayer!), file);
      if (layer === "cli") assert.ok(["cli", "application"].includes(targetLayer!), file);
      if (layer === "infrastructure") assert.ok(["infrastructure", "application", "domain"].includes(targetLayer!), file);
    }
  }
});
