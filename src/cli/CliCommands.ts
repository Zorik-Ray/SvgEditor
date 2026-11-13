import type { EditorSession } from "../application/EditorSession.js";
import type { CommandDispatcher } from "./CommandDispatcher.js";
import { TreePrinter } from "./TreePrinter.js";
import { ShowPrinter } from "./ShowPrinter.js";

export class CliCommands {
  constructor(
    private readonly dispatcher: CommandDispatcher,
    private readonly session: EditorSession,
  ) {
    this.documents();
    this.histories();
    this.edits();
    this.displays();
  }

  private documents(): void {
    this.dispatcher.register("read", {
      syntax: "read <file.svg>", withoutDocument: true,
      run: (arguments_) => this.session.read(arguments_.count(1).at(0)),
    });
    this.dispatcher.register("save", {
      syntax: "save [file.svg]", withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(0, 1);
        return this.session.save(arguments_.tokens[0]?.value);
      },
    });
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

  private displays(): void {
    this.dispatcher.register("tree", {
      syntax: "tree [id]", withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(0, 1);
        return { output: new TreePrinter().render(this.session.tree(arguments_.tokens[0]?.value)) };
      },
    });
    this.dispatcher.register("show", {
      syntax: "show <id>", withoutDocument: false,
      run: (arguments_) => ({ output: new ShowPrinter().render(this.session.show(arguments_.count(1).at(0))) }),
    });
    this.dispatcher.register("help", {
      syntax: "help", withoutDocument: false,
      run: (arguments_) => {
        arguments_.count(0);
        return { output: [
          ...this.dispatcher.syntaxes(),
          "",
          "create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]",
          "create circle <id> <cx> <cy> <r> [fill] [in <containerId>]",
          "create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]",
          "create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]",
          'create text <id> <x> <y> "content" [in <containerId>]',
          "create g <id> [in <containerId>]",
          "init/read/save/canvas resize begin a new undo history; tree/show/help/canvas query do not.",
          "Lines beginning with # are comments; quote arguments containing spaces.",
        ] };
      },
    });
  }
}
