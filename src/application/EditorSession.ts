import { SvgDocument } from "../domain/SvgDocument.js";
import { NumberValue } from "../domain/NumberValue.js";
import type { LineResult } from "./LineExecutor.js";
import { HistoryManager } from "./HistoryManager.js";
import type { EditCommand } from "./commands/EditCommand.js";

export class EditorSession {
  private document?: SvgDocument;
  private sourcePath?: string;
  private readonly history = new HistoryManager();

  requireDocument(): SvgDocument {
    if (!this.document) throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }

  state() {
    return { document: this.document?.toRecord(), sourcePath: this.sourcePath, history: this.history.status };
  }

  init(width = "800", height = "600"): LineResult {
    const candidate = new SvgDocument(NumberValue.parse(width), NumberValue.parse(height));
    this.document = candidate;
    this.sourcePath = undefined;
    this.history.barrier();
    return { output: [`canvas ${candidate.width}x${candidate.height} created`] };
  }

  canvas(width?: string, height?: string): LineResult {
    const document = this.requireDocument();
    if (width === undefined) return { output: [`canvas ${document.width}x${document.height}`] };
    document.resize(NumberValue.parse(width), height === undefined ? document.height : NumberValue.parse(height));
    this.history.barrier();
    return { output: [`canvas resized to ${document.width}x${document.height}`] };
  }

  edit(command: EditCommand): LineResult {
    return { output: [this.history.execute(command, this.requireDocument())] };
  }

  undo(): LineResult {
    this.requireDocument();
    return { output: [this.history.undo()] };
  }

  redo(): LineResult {
    this.requireDocument();
    return { output: [this.history.redo()] };
  }
}
