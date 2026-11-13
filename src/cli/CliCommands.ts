import type { EditorSession } from "../application/EditorSession.js";
import type { CommandDispatcher } from "./CommandDispatcher.js";

export class CliCommands {
  constructor(
    private readonly dispatcher: CommandDispatcher,
    private readonly session: EditorSession,
  ) {
    this.documents();
    this.histories();
    this.edits();
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

  private edits(): void {
    this.dispatcher.register("create", {
      syntax: "create <type> <id> [params…] [in <containerId>]", withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(2, Infinity);
        const tokens = arguments_.tokens;
        const marker = tokens.at(-2);
        const hasParent = tokens.length >= 4 && marker?.value === "in" && !marker.quoted;
        const parameters = tokens.slice(2, hasParent ? -2 : undefined).map((token) => token.value);
        return this.session.create(arguments_.at(0), arguments_.at(1), parameters, hasParent ? tokens.at(-1)!.value : undefined);
      },
    });
    this.dispatcher.register("delete", {
      syntax: "delete <id>", withoutDocument: false,
      run: (arguments_) => this.session.delete(arguments_.count(1).at(0)),
    });
    this.dispatcher.register("move", {
      syntax: "move <id> <dx> <dy>", withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(3);
        return this.session.move(arguments_.at(0), arguments_.at(1), arguments_.at(2));
      },
    });
    this.dispatcher.register("scale", {
      syntax: "scale <id> <factor>", withoutDocument: false,
      run: (arguments_) => this.session.scale(arguments_.count(2).at(0), arguments_.at(1)),
    });
    this.dispatcher.register("set", {
      syntax: "set <id> <attr> <value>", withoutDocument: false,
      run: (arguments_) => this.session.set(arguments_.count(3).at(0), arguments_.at(1), arguments_.at(2)),
    });
    this.dispatcher.register("group", {
      syntax: "group <newGid> <id1> <id2>…", withoutDocument: false,
      run: (arguments_) => this.session.group(arguments_.count(3, Infinity).at(0), arguments_.values().slice(1)),
    });
    this.dispatcher.register("ungroup", {
      syntax: "ungroup <gid>", withoutDocument: false,
      run: (arguments_) => this.session.ungroup(arguments_.count(1).at(0)),
    });
    this.dispatcher.register("addto", {
      syntax: "addto <gid> <id>", withoutDocument: false,
      run: (arguments_) => this.session.addto(arguments_.count(2).at(0), arguments_.at(1)),
    });
    this.dispatcher.register("front", {
      syntax: "front <id>", withoutDocument: false,
      run: (arguments_) => this.session.front(arguments_.count(1).at(0)),
    });
    this.dispatcher.register("back", {
      syntax: "back <id>", withoutDocument: false,
      run: (arguments_) => this.session.back(arguments_.count(1).at(0)),
    });
  }
}
