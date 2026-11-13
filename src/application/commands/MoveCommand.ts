import type { SvgDocument } from "../../domain/SvgDocument.js";
import { NumberValue } from "../../domain/NumberValue.js";
import { EditCommand } from "./EditCommand.js";

export class MoveCommand extends EditCommand {
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }

  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.id);
    shape.move(this.dx, this.dy);
    this.undoMessage = `${shape.tag}#${this.id} moved back by (${NumberValue.format(-this.dx)},${NumberValue.format(-this.dy)})`;
    return `${shape.tag}#${this.id} moved by (${NumberValue.format(this.dx)},${NumberValue.format(this.dy)})`;
  }
}
