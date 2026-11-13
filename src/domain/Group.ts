import { Shape } from "./Shape.js";
import { NumberValue } from "./NumberValue.js";

export class Group extends Shape {
  private readonly members: Shape[] = [];

  constructor(id: string) {
    super(id, "g", {}, [], []);
  }

  override get children(): readonly Shape[] {
    return [...this.members];
  }

  override asGroup(): Group {
    return this;
  }

  insertChild(shape: Shape, index = this.members.length): void {
    if (index < 0 || index > this.members.length) throw new Error("invalid child position");
    this.members.splice(index, 0, shape);
  }

  removeChild(shape: Shape): void {
    const index = this.members.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.members.splice(index, 1);
  }

  override move(dx: number, dy: number): void {
    NumberValue.parse(dx);
    NumberValue.parse(dy);
    const [localX, localY] = this.localDelta(dx, dy);
    for (const child of this.members) child.move(localX, localY);
  }

  override scale(factor: number): void {
    NumberValue.positive(factor, "scale factor");
    for (const child of this.members) child.scale(factor);
    this.scaleTransformTranslation(factor);
  }

  override clone(): Group {
    const copy = this.copyAppearanceTo(new Group(this.id));
    for (const child of this.members) copy.insertChild(child.clone());
    return copy;
  }

  protected override geometrySummary(): string {
    return "";
  }
}
