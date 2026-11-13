import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }

  protected override apply(document: SvgDocument): string {
    const group = document.requireGroup(this.id);
    const location = document.locationOf(this.id);
    if (location.parentId === undefined) throw new Error(`cannot ungroup top-level container: ${this.id}`);
    const children = group.children;
    document.detach(this.id);
    children.forEach((child, offset) => document.insert(child, location.parentId, location.index + offset));
    this.undoMessage = `g#${this.id} restored with ${children.length} children`;
    return `g#${this.id} ungrouped (${children.length} children)`;
  }
}
