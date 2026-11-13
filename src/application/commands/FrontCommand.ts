import { OrderCommand } from "./OrderCommand.js";

export class FrontCommand extends OrderCommand {
  constructor(id: string) { super(id, true); }
}
