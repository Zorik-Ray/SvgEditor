import { NumberValue } from "./NumberValue.js";
import type { ShapeRecord } from "./ShapeRecord.js";

export abstract class Shape {
  private readonly geometry = new Map<string, number>();
  private readonly appearance = new Map<string, string>();

  protected constructor(
    readonly id: string,
    readonly tag: string,
    geometry: Readonly<Record<string, number>>,
    private readonly nonnegative: readonly string[],
    private readonly positionPairs: readonly (readonly [string, string])[],
  ) {
    if (!id.trim()) throw new Error("id must not be empty");
    this.updateGeometry(geometry);
  }

  get children(): readonly Shape[] {
    return [];
  }

  abstract clone(): Shape;
  protected abstract geometrySummary(): string;

  move(dx: number, dy: number): void {
    NumberValue.parse(dx);
    NumberValue.parse(dy);
    const updated: Record<string, number> = {};
    for (const [horizontal, vertical] of this.positionPairs) {
      updated[horizontal] = this.number(horizontal) + dx;
      updated[vertical] = this.number(vertical) + dy;
    }
    this.updateGeometry(updated);
  }

  scale(factor: number): void {
    NumberValue.positive(factor, "scale factor");
    const updated = Object.fromEntries(
      [...this.geometry].map(([name, value]) => [name, value * factor]),
    );
    this.updateGeometry(updated);
  }

  set(name: string, value: string): void {
    if (this.geometry.has(name)) {
      this.updateGeometry({ [name]: NumberValue.parse(value) });
      return;
    }
    if (name === "stroke-width") {
      this.appearance.set(name, NumberValue.format(NumberValue.nonnegative(value, name)));
      return;
    }
    if (name === "fill" || name === "stroke") {
      this.appearance.set(name, value);
      return;
    }
    throw new Error(`unknown attribute: ${name}`);
  }

  importAttributes(attributes: Readonly<Record<string, string>>): void {
    for (const [name, value] of Object.entries(attributes)) {
      if (name === "id" || this.geometry.has(name)) continue;
      if (name === "fill" || name === "stroke" || name === "stroke-width") this.set(name, value);
      else this.appearance.set(name, value);
    }
  }

  describe(): string {
    const details = [this.geometrySummary()];
    for (const name of ["fill", "stroke", "stroke-width"]) {
      const value = this.appearance.get(name);
      if (value !== undefined) details.push(`${name}=${value}`);
    }
    return [`${this.tag}#${this.id}`, ...details.filter(Boolean)].join(" ");
  }

  toRecord(): ShapeRecord {
    return {
      tag: this.tag,
      attributes: {
        id: this.id,
        ...Object.fromEntries([...this.geometry].map(([name, value]) => [name, NumberValue.format(value)])),
        ...Object.fromEntries(this.appearance),
      },
      children: this.children.map((child) => child.toRecord()),
    };
  }

  protected number(name: string): number {
    const value = this.geometry.get(name);
    if (value === undefined) throw new Error(`unknown geometry: ${name}`);
    return value;
  }

  protected copyAppearanceTo<T extends Shape>(target: T): T {
    target.importAttributes(Object.fromEntries(this.appearance));
    return target;
  }

  private updateGeometry(updated: Readonly<Record<string, number>>): void {
    for (const [name, value] of Object.entries(updated)) {
      if (this.nonnegative.includes(name)) NumberValue.nonnegative(value, name);
      else NumberValue.parse(value);
    }
    for (const [name, value] of Object.entries(updated)) this.geometry.set(name, value);
  }
}
