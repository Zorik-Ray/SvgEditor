import type { SvgDocument } from "../domain/SvgDocument.js";
import type { EditCommand } from "./commands/EditCommand.js";

export class HistoryManager {
  private readonly undoCommands: EditCommand[] = [];
  private readonly redoCommands: EditCommand[] = [];
  private blocked = false;

  get status(): Readonly<{ undo: number; redo: number; blocked: boolean }> {
    return { undo: this.undoCommands.length, redo: this.redoCommands.length, blocked: this.blocked };
  }

  execute(command: EditCommand, document: SvgDocument): string {
    const message = command.execute(document);
    this.undoCommands.push(command);
    this.redoCommands.length = 0;
    this.blocked = false;
    return message;
  }

  undo(): string {
    this.ensureAllowed();
    const command = this.undoCommands.at(-1);
    if (!command) throw new Error("nothing to undo");
    const message = command.undo();
    this.undoCommands.pop();
    this.redoCommands.push(command);
    return message;
  }

  redo(): string {
    this.ensureAllowed();
    const command = this.redoCommands.at(-1);
    if (!command) throw new Error("nothing to redo");
    const message = command.redo();
    this.redoCommands.pop();
    this.undoCommands.push(command);
    return message;
  }

  barrier(): void {
    this.undoCommands.length = 0;
    this.redoCommands.length = 0;
    this.blocked = true;
  }

  private ensureAllowed(): void {
    if (this.blocked) throw new Error("undo not allowed after io command");
  }
}
