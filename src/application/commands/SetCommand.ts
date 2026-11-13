import type { SvgDocument } from "../../domain/SvgDocument.js";
import { EditCommand } from "./EditCommand.js";

export class SetCommand extends EditCommand {
  constructor(private readonly id: string, private readonly name: string, private readonly value: string) { super(); }

  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.id);
    const previous = shape.inspect();
    const oldValue = this.name === "text" ? previous.text : previous.attributes[this.name];
    shape.set(this.name, this.value);
    const prefix = `${shape.tag}#${this.id}`;
    this.undoMessage = oldValue === undefined
      ? `${prefix} restored: ${this.name} unset`
      : `${prefix} restored: ${this.name}=${JSON.stringify(oldValue)}`;
    return `${prefix} updated: ${this.name}=${this.name === "text" ? JSON.stringify(this.value) : this.value}`;
  }
}
