import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class AddToCommand extends EditCommand {
  constructor(private readonly groupId: string, private readonly id: string) { super(); }

  protected override apply(document: SvgDocument): string {
    document.requireGroup(this.groupId);
    const shape = document.find(this.id);
    if (this.id === this.groupId || document.ancestorsOf(this.groupId).includes(this.id)) {
      throw new Error(`cannot add a container into its own descendant: ${this.id}`);
    }
    const parent = document.parentOf(this.id);
    document.detach(this.id);
    document.insert(shape, this.groupId);
    this.undoMessage = `${shape.tag}#${this.id} restored into ${parent ? `g#${parent.id}` : "svg"}`;
    return `${shape.tag}#${this.id} added to g#${this.groupId}`;
  }
}
