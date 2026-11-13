import type { SvgDocument } from "../../domain/SvgDocument.js";

export abstract class EditCommand {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private target?: SvgDocument;
  private message = "";
  protected undoMessage = "";

  execute(document: SvgDocument): string {
    const before = document.clone();
    try {
      const message = this.apply(document);
      const after = document.clone();
      this.before = before;
      this.after = after;
      this.target = document;
      this.message = message;
      return message;
    } catch (error) {
      document.restore(before);
      throw error;
    }
  }

  undo(): string {
    if (!this.before || !this.target) throw new Error("command has not executed");
    this.target.restore(this.before);
    return this.undoMessage || `undone: ${this.message}`;
  }

  redo(): string {
    if (!this.after || !this.target) throw new Error("command has not executed");
    this.target.restore(this.after);
    return this.message;
  }

  protected abstract apply(document: SvgDocument): string;
}
