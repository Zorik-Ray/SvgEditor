import { Group } from "../../domain/Group.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class GroupCommand extends EditCommand {
  constructor(private readonly id: string, private readonly members: readonly string[]) { super(); }

  protected override apply(document: SvgDocument): string {
    if (document.has(this.id)) throw new Error(`id already exists: ${this.id}`);
    if (this.members.length < 2) throw new Error("group requires at least two shapes");
    const selected = new Set(this.members);
    if (selected.size !== this.members.length) throw new Error("duplicate shape in group command");
    for (const id of this.members) document.find(id);
    const ordered = document.allShapes().filter((shape) => selected.has(shape.id));
    for (const shape of ordered) {
      const ancestor = document.ancestorsOf(shape.id).find((id) => id !== undefined && selected.has(id));
      if (ancestor) throw new Error(`cannot group a container into its own descendant: ${ancestor}`);
    }
    const first = ordered[0]!;
    const parentId = document.ancestorsOf(first.id).find((candidate) =>
      ordered.every((shape) => document.ancestorsOf(shape.id).includes(candidate)),
    );
    let anchor = first;
    while (document.parentOf(anchor.id)?.id !== parentId) anchor = document.parentOf(anchor.id)!;
    const position = document.locationOf(anchor.id).index;
    for (const shape of ordered) document.detach(shape.id);
    const group = new Group(this.id);
    for (const shape of ordered) group.insertChild(shape);
    document.insert(group, parentId, position);
    this.undoMessage = `g#${this.id} undone; ${ordered.length} children restored to original parents`;
    return `g#${this.id} created with ${ordered.length} children`;
  }
}
