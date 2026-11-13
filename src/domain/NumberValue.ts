export class NumberValue {
  static parse(value: string | number): number {
    if (typeof value === "string" && !value.trim()) throw new Error("expected a finite number");
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`expected a finite number: ${value}`);
    return parsed;
  }

  static nonnegative(value: string | number, name: string): number {
    const parsed = this.parse(value);
    if (parsed < 0) throw new Error(`${name} must not be negative`);
    return parsed;
  }

  static positive(value: string | number, name: string): number {
    const parsed = this.parse(value);
    if (parsed <= 0) throw new Error(`${name} must be positive`);
    return parsed;
  }

  static format(value: number): string {
    return String(Object.is(value, -0) ? 0 : value);
  }
}
