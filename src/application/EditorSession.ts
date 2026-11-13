import { SvgDocument } from "../domain/SvgDocument.js";
import { NumberValue } from "../domain/NumberValue.js";
import type { LineResult } from "./LineExecutor.js";
import { HistoryManager } from "./HistoryManager.js";
import type { EditCommand } from "./commands/EditCommand.js";
import { ShapeFactory } from "./ShapeFactory.js";
import { CreateCommand } from "./commands/CreateCommand.js";
import { DeleteCommand } from "./commands/DeleteCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { ScaleCommand } from "./commands/ScaleCommand.js";
import { SetCommand } from "./commands/SetCommand.js";
import { GroupCommand } from "./commands/GroupCommand.js";
import { UngroupCommand } from "./commands/UngroupCommand.js";
import { AddToCommand } from "./commands/AddToCommand.js";
import { FrontCommand } from "./commands/FrontCommand.js";
import { BackCommand } from "./commands/BackCommand.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeDetails, TreeNode } from "./Inspection.js";
import type { SvgEncoder } from "./ports/SvgEncoder.js";
import type { SvgDecoder } from "./ports/SvgDecoder.js";
import type { FileStore } from "./ports/FileStore.js";

export class EditorSession {
  private document?: SvgDocument;
  private sourcePath?: string;
  private readonly history = new HistoryManager();

  constructor(
    private readonly factory = new ShapeFactory(),
    private readonly decoder?: SvgDecoder,
    private readonly encoder?: SvgEncoder,
    private readonly files?: FileStore,
  ) {}

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

  async read(file: string): Promise<LineResult> {
    if (!this.files || !this.decoder) throw new Error("SVG reading is not configured");
    const source = await this.files.read(file);
    const imported = this.decoder.decode(source);
    this.document = imported.document;
    this.sourcePath = file;
    this.history.barrier();
    return { output: [`read ${file} (${imported.document.count} elements)`], warnings: imported.warnings };
  }

  async save(file?: string): Promise<LineResult> {
    const document = this.requireDocument();
    const target = file ?? this.sourcePath;
    if (target === undefined) throw new Error("no file path. use 'save <file.svg>'");
    if (!this.files || !this.encoder) throw new Error("SVG writing is not configured");
    const content = this.encoder.encode(document);
    await this.files.write(target, content);
    this.history.barrier();
    return { output: [`saved to ${target} (${document.count} elements)`] };
  }

  edit(command: EditCommand): LineResult {
    return { output: [this.history.execute(command, this.requireDocument())] };
  }

  create(type: string, id: string, parameters: readonly string[], parentId?: string): LineResult {
    return this.edit(new CreateCommand(this.factory, type, id, parameters, parentId));
  }

  delete(id: string): LineResult { return this.edit(new DeleteCommand(id)); }
  move(id: string, dx: string, dy: string): LineResult {
    return this.edit(new MoveCommand(id, NumberValue.parse(dx), NumberValue.parse(dy)));
  }
  scale(id: string, factor: string): LineResult {
    return this.edit(new ScaleCommand(id, NumberValue.parse(factor)));
  }
  set(id: string, name: string, value: string): LineResult { return this.edit(new SetCommand(id, name, value)); }
  group(id: string, members: readonly string[]): LineResult { return this.edit(new GroupCommand(id, members)); }
  ungroup(id: string): LineResult { return this.edit(new UngroupCommand(id)); }
  addto(groupId: string, id: string): LineResult { return this.edit(new AddToCommand(groupId, id)); }
  front(id: string): LineResult { return this.edit(new FrontCommand(id)); }
  back(id: string): LineResult { return this.edit(new BackCommand(id)); }

  tree(id?: string): TreeNode {
    const document = this.requireDocument();
    if (id !== undefined) return this.describeNode(document.find(id));
    return {
      summary: `svg (${document.width}x${document.height})`,
      children: document.children.map((shape) => this.describeNode(shape)),
    };
  }

  show(id: string): ShapeDetails {
    const document = this.requireDocument();
    const shape = document.find(id);
    const record = shape.inspect();
    const parent = document.parentOf(id);
    const { id: omitted, ...attributes } = record.attributes;
    void omitted;
    return { heading: `${shape.tag}#${id}  parent=${parent ? `g#${parent.id}` : "svg"}`, attributes, text: record.text };
  }

  undo(): LineResult {
    this.requireDocument();
    return { output: [this.history.undo()] };
  }

  redo(): LineResult {
    this.requireDocument();
    return { output: [this.history.redo()] };
  }

  private describeNode(shape: Shape): TreeNode {
    return { summary: shape.describe(), children: shape.children.map((child) => this.describeNode(child)) };
  }
}
