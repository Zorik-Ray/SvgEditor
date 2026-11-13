import { Shape } from "./Shape.js";

export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, radius: number) {
    super(id, "circle", { cx, cy, r: radius }, ["r"], [["cx", "cy"]]);
  }

  override clone(): Circle {
    return this.copyAppearanceTo(new Circle(this.id, this.number("cx"), this.number("cy"), this.number("r")));
  }

  protected override geometrySummary(): string {
    return `cx=${this.number("cx")} cy=${this.number("cy")} r=${this.number("r")}`;
  }
}
