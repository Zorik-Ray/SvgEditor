import { EditCommand } from "../../src/application/commands/EditCommand.js";
import type { SvgDocument } from "../../src/domain/SvgDocument.js";

export class TestEdit extends EditCommand {
  constructor(private readonly action: (document: SvgDocument) => void) { super(); }
  protected override apply(document: SvgDocument): string {
    this.action(document);
    return "changed";
  }
}
