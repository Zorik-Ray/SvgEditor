export interface ShapeRecord {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text?: string;
  readonly children: readonly ShapeRecord[];
}
