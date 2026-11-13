import type { EditorSession } from "../application/EditorSession.js";
import type { CommandDispatcher } from "./CommandDispatcher.js";

export class CliCommands {
  constructor(
    private readonly dispatcher: CommandDispatcher,
    private readonly session: EditorSession,
  ) {
    this.documents();
    this.histories();
  }

  private documents(): void {
    this.dispatcher.register("init", {
      syntax: "init [w] [h]",
      withoutDocument: true,
      run: (arguments_) => {
        arguments_.count(0, 2);
        return this.session.init(arguments_.tokens[0]?.value, arguments_.tokens[1]?.value);
      },
    });
    this.dispatcher.register("canvas", {
      syntax: "canvas [w] [h]",
      withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(0, 2);
        return this.session.canvas(arguments_.tokens[0]?.value, arguments_.tokens[1]?.value);
      },
    });
  }

  private histories(): void {
    this.dispatcher.register("undo", {
      syntax: "undo", withoutDocument: false,
      run: (arguments_) => { arguments_.count(0); return this.session.undo(); },
    });
    this.dispatcher.register("redo", {
      syntax: "redo", withoutDocument: false,
      run: (arguments_) => { arguments_.count(0); return this.session.redo(); },
    });
  }
}
