import { Shape } from "./Shape.js";

export class Rect extends Shape {
  constructor(id: string, coordinateX: number, coordinateY: number, width: number, height: number) {
    super(id, "rect", { x: coordinateX, y: coordinateY, width, height }, ["width", "height"], [["x", "y"]]);
  }

  override clone(): Rect {
    return this.copyAppearanceTo(
      new Rect(this.id, this.number("x"), this.number("y"), this.number("width"), this.number("height")),
    );
  }

  protected override geometrySummary(): string {
    return `x=${this.number("x")} y=${this.number("y")} w=${this.number("width")} h=${this.number("height")}`;
  }
}
