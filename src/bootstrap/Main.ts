import { EditorSession } from "../application/EditorSession.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { CliCommands } from "../cli/CliCommands.js";
import { Repl } from "../cli/Repl.js";

class Main {
  static async run(): Promise<void> {
    const session = new EditorSession();
    const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
    new CliCommands(dispatcher, session);
    await new Repl(dispatcher).run();
  }
}

await Main.run();
