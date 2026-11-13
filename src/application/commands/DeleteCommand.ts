import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class DeleteCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }

  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.id);
    const parent = document.parentOf(this.id);
    document.detach(this.id);
    this.undoMessage = `${shape.tag}#${this.id} restored into ${parent ? `g#${parent.id}` : "svg"}`;
    return `${shape.tag}#${this.id} deleted`;
  }
}
