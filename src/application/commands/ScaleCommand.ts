import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class ScaleCommand extends EditCommand {
  constructor(private readonly id: string, private readonly factor: number) { super(); }

  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.id);
    shape.scale(this.factor);
    this.undoMessage = `${shape.tag}#${this.id} scale restored`;
    return `${shape.tag}#${this.id} scaled by ${this.factor}`;
  }
}
