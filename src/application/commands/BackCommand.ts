import { OrderCommand } from "./OrderCommand.js";

export class BackCommand extends OrderCommand {
  constructor(id: string) { super(id, false); }
}
