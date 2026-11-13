import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { ShapeFactory } from "../ShapeFactory.js";
import { EditCommand } from "./EditCommand.js";

export class CreateCommand extends EditCommand {
  constructor(
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: readonly string[],
    private readonly parentId?: string,
  ) { super(); }

  protected override apply(document: SvgDocument): string {
    const shape = this.factory.create(this.type, this.id, this.parameters);
    document.insert(shape, this.parentId);
    this.undoMessage = `${shape.tag}#${shape.id} deleted`;
    return `${shape.tag}#${shape.id} created${this.parentId ? ` in g#${this.parentId}` : ""}`;
  }
}
