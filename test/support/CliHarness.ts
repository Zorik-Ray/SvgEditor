import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export class CliHarness {
  static run(script: string, directory: string): Promise<{ output: string; errors: string; status: number | null }> {
    const entry = fileURLToPath(new URL("../../src/bootstrap/Main.js", import.meta.url));
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [entry], { cwd: directory, stdio: ["pipe", "pipe", "pipe"] });
      let output = "";
      let errors = "";
      child.stdout.setEncoding("utf8").on("data", (data: string) => { output += data; });
      child.stderr.setEncoding("utf8").on("data", (data: string) => { errors += data; });
      child.on("error", reject);
      child.on("close", (status) => resolve({ output, errors, status }));
      child.stdin.end(script);
    });
  }
}
