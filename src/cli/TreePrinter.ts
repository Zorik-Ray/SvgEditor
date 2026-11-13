import type { TreeNode } from "../application/Inspection.js";

export class TreePrinter {
  render(root: TreeNode): readonly string[] {
    return [root.summary, ...this.children(root.children, "")];
  }

  private children(nodes: readonly TreeNode[], prefix: string): string[] {
    return nodes.flatMap((node, index) => {
      const last = index === nodes.length - 1;
      return [
        `${prefix}${last ? "└──" : "├──"} ${node.summary}`,
        ...this.children(node.children, `${prefix}${last ? "    " : "│   "}`),
      ];
    });
  }
}
