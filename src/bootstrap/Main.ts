import { EditorSession } from "../application/EditorSession.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { CliCommands } from "../cli/CliCommands.js";
import { Repl } from "../cli/Repl.js";
import { ShapeFactory } from "../application/ShapeFactory.js";
import { SvgReader } from "../infrastructure/SvgReader.js";
import { SvgWriter } from "../infrastructure/SvgWriter.js";
import { NodeFileStore } from "../infrastructure/NodeFileStore.js";

class Main {
  static async run(): Promise<void> {
    const factory = new ShapeFactory();
    const session = new EditorSession(factory, new SvgReader(factory), new SvgWriter(), new NodeFileStore());
    const dispatcher = new CommandDispatcher(() => { session.requireDocument(); });
    new CliCommands(dispatcher, session);
    await new Repl(dispatcher).run();
  }
}

await Main.run();
