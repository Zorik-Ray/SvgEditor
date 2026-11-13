import { Group } from "./Group.js";
import { NumberValue } from "./NumberValue.js";
import type { Shape } from "./Shape.js";
import type { ShapeRecord } from "./ShapeRecord.js";

export interface ShapeLocation {
  readonly parentId?: string;
  readonly index: number;
}

export class SvgDocument {
  private rootShapes: Shape[] = [];
  private readonly index = new Map<string, Shape>();
  private readonly parents = new Map<string, Group | undefined>();
  private canvasWidth: number;
  private canvasHeight: number;
  private rootAttributes: Record<string, string>;

  constructor(width = 800, height = 600, attributes: Readonly<Record<string, string>> = {}) {
    this.canvasWidth = NumberValue.positive(width, "canvas width");
    this.canvasHeight = NumberValue.positive(height, "canvas height");
    this.rootAttributes = { ...attributes };
  }

  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get count(): number { return this.index.size; }
  get children(): readonly Shape[] { return [...this.rootShapes]; }

  resize(width: number, height: number): void {
    NumberValue.positive(width, "canvas width");
    NumberValue.positive(height, "canvas height");
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.rootAttributes.viewBox = `0 0 ${width} ${height}`;
  }

  find(id: string): Shape {
    const shape = this.index.get(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  has(id: string): boolean {
    return this.index.has(id);
  }

  requireGroup(id: string): Group {
    const shape = this.index.get(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    return shape.asGroup();
  }

  parentOf(id: string): Group | undefined {
    this.find(id);
    return this.parents.get(id);
  }

  locationOf(id: string): ShapeLocation {
    const shape = this.find(id);
    const parent = this.parentOf(id);
    return { parentId: parent?.id, index: (parent?.children ?? this.rootShapes).indexOf(shape) };
  }

  insert(shape: Shape, parentId?: string, position?: number): void {
    const parent = parentId === undefined ? undefined : this.requireGroup(parentId);
    const subtree = this.walk([shape]);
    const seen = new Set<string>();
    for (const node of subtree) {
      if (this.has(node.id) || seen.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      seen.add(node.id);
    }
    const length = parent?.children.length ?? this.rootShapes.length;
    const insertion = position ?? length;
    if (!Number.isInteger(insertion) || insertion < 0 || insertion > length) throw new Error("invalid child position");
    if (parent) parent.insertChild(shape, insertion);
    else this.rootShapes.splice(insertion, 0, shape);
    this.register(shape, parent);
  }

  detach(id: string): Shape {
    const shape = this.find(id);
    const parent = this.parentOf(id);
    if (parent) parent.removeChild(shape);
    else this.rootShapes.splice(this.rootShapes.indexOf(shape), 1);
    for (const node of this.walk([shape])) {
      this.index.delete(node.id);
      this.parents.delete(node.id);
    }
    return shape;
  }

  allShapes(): readonly Shape[] {
    return this.walk(this.rootShapes);
  }

  ancestorsOf(id: string): readonly (string | undefined)[] {
    const ancestors: (string | undefined)[] = [];
    let parent = this.parentOf(id);
    while (parent) {
      ancestors.push(parent.id);
      parent = this.parentOf(parent.id);
    }
    ancestors.push(undefined);
    return ancestors;
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height, this.rootAttributes);
    for (const child of this.rootShapes) copy.insert(child.clone());
    return copy;
  }

  restore(snapshot: SvgDocument): void {
    const copy = snapshot.clone();
    this.rootShapes = [];
    this.index.clear();
    this.parents.clear();
    this.canvasWidth = copy.width;
    this.canvasHeight = copy.height;
    this.rootAttributes = { ...copy.rootAttributes };
    for (const shape of copy.children) this.insert(shape);
  }

  toRecord(): ShapeRecord {
    return {
      tag: "svg",
      attributes: {
        xmlns: "http://www.w3.org/2000/svg",
        ...this.rootAttributes,
        width: String(this.width),
        height: String(this.height),
        viewBox: this.rootAttributes.viewBox ?? `0 0 ${this.width} ${this.height}`,
      },
      children: this.rootShapes.map((shape) => shape.toRecord()),
    };
  }

  private register(shape: Shape, parent?: Group): void {
    this.index.set(shape.id, shape);
    this.parents.set(shape.id, parent);
    if (shape.children.length) {
      const group = shape.asGroup();
      for (const child of shape.children) this.register(child, group);
    }
  }

  private walk(shapes: readonly Shape[]): Shape[] {
    return shapes.flatMap((shape) => [shape, ...this.walk(shape.children)]);
  }
}
