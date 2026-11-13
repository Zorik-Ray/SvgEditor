import { NumberValue } from "./NumberValue.js";

export class Transform {
  private multiplier = 1;
  private offsetX = 0;
  private offsetY = 0;
  private present = false;

  static parse(source: string): Transform {
    const result = new Transform();
    const pattern = /(translate|scale)\s*\(([^()]*)\)/g;
    let consumed = 0;
    for (const match of source.matchAll(pattern)) {
      if (source.slice(consumed, match.index).trim()) throw new Error(`unsupported transform: ${source}`);
      const values = match[2]!.trim().split(/[\s,]+/).filter(Boolean).map((value) => NumberValue.parse(value));
      if (values.length < 1 || values.length > 2) throw new Error(`invalid transform: ${source}`);
      if (match[1] === "translate") {
        result.offsetX += result.multiplier * values[0]!;
        result.offsetY += result.multiplier * (values[1] ?? 0);
      } else {
        if (values[1] !== undefined && values[1] !== values[0]) throw new Error("only uniform scale transforms are supported");
        result.multiplier *= NumberValue.positive(values[0]!, "transform scale");
      }
      NumberValue.parse(result.multiplier);
      NumberValue.parse(result.offsetX);
      NumberValue.parse(result.offsetY);
      consumed = match.index! + match[0].length;
      result.present = true;
    }
    if (source.slice(consumed).trim()) throw new Error(`unsupported transform: ${source}`);
    return result;
  }

  localDelta(dx: number, dy: number): readonly [number, number] {
    return [dx / this.multiplier, dy / this.multiplier];
  }

  scaleTranslation(factor: number): void {
    const nextX = NumberValue.parse(this.offsetX * factor);
    const nextY = NumberValue.parse(this.offsetY * factor);
    this.offsetX = nextX;
    this.offsetY = nextY;
  }

  clone(): Transform {
    const copy = new Transform();
    copy.multiplier = this.multiplier;
    copy.offsetX = this.offsetX;
    copy.offsetY = this.offsetY;
    copy.present = this.present;
    return copy;
  }

  toAttribute(): string | undefined {
    return this.present ? `translate(${this.offsetX},${this.offsetY}) scale(${this.multiplier})` : undefined;
  }
}
