import { Shape } from "./Shape.js";
import type { ShapeRecord } from "./ShapeRecord.js";

export class Text extends Shape {
  constructor(id: string, coordinateX: number, coordinateY: number, private content: string) {
    super(id, "text", { x: coordinateX, y: coordinateY }, [], [["x", "y"]]);
  }

  override set(name: string, value: string): void {
    if (name === "text") this.content = value;
    else super.set(name, value);
  }

  override clone(): Text {
    return this.copyAppearanceTo(new Text(this.id, this.number("x"), this.number("y"), this.content));
  }

  override toRecord(): ShapeRecord {
    return { ...super.toRecord(), text: this.content };
  }

  protected override geometrySummary(): string {
    return `(${this.number("x")},${this.number("y")}) ${JSON.stringify(this.content)}`;
  }
}
