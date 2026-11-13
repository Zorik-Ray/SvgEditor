import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export abstract class OrderCommand extends EditCommand {
  protected constructor(private readonly id: string, private readonly toFront: boolean) { super(); }

  protected override apply(document: SvgDocument): string {
    const location = document.locationOf(this.id);
    const siblings = document.parentOf(this.id)?.children ?? document.children;
    const shape = document.detach(this.id);
    document.insert(shape, location.parentId, this.toFront ? siblings.length - 1 : 0);
    this.undoMessage = `${shape.tag}#${this.id} order restored`;
    return `${shape.tag}#${this.id} moved to ${this.toFront ? "front" : "back"}`;
  }
}
