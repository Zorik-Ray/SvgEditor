export interface TreeNode {
  readonly summary: string;
  readonly children: readonly TreeNode[];
}

export interface ShapeDetails {
  readonly heading: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text?: string;
}
