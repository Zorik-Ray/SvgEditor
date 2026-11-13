import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, "ellipse", { cx, cy, rx, ry }, ["rx", "ry"], [["cx", "cy"]]);
  }

  override clone(): Ellipse {
    return this.copyAppearanceTo(
      new Ellipse(this.id, this.number("cx"), this.number("cy"), this.number("rx"), this.number("ry")),
    );
  }

  protected override geometrySummary(): string {
    return `cx=${this.number("cx")} cy=${this.number("cy")} rx=${this.number("rx")} ry=${this.number("ry")}`;
  }
}
