export class ShapeId {
  static validate(id: string): void {
    if (!id.trim()) throw new Error("id must not be empty");
    if (/[\t\n\r ]/.test(id)) throw new Error("id must not contain whitespace");
  }
}
