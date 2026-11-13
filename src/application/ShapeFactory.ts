import { Circle } from "../domain/Circle.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { NumberValue } from "../domain/NumberValue.js";
import { Rect } from "../domain/Rect.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeRecord } from "../domain/ShapeRecord.js";
import { Text } from "../domain/Text.js";

interface ShapeDefinition {
  readonly parameters: readonly string[];
  readonly optionalStyle?: string;
  readonly build: (id: string, values: Readonly<Record<string, string>>, text: string) => Shape;
}

export class ShapeFactory {
  private readonly definitions = new Map<string, ShapeDefinition>([
    ["rect", {
      parameters: ["x", "y", "width", "height"],
      optionalStyle: "fill",
      build: (id, values) => new Rect(id, NumberValue.parse(values.x ?? "0"), NumberValue.parse(values.y ?? "0"),
        NumberValue.parse(values.width ?? "0"), NumberValue.parse(values.height ?? "0")),
    }],
    ["circle", {
      parameters: ["cx", "cy", "r"],
      optionalStyle: "fill",
      build: (id, values) => new Circle(id, NumberValue.parse(values.cx ?? "0"), NumberValue.parse(values.cy ?? "0"),
        NumberValue.parse(values.r ?? "0")),
    }],
    ["ellipse", {
      parameters: ["cx", "cy", "rx", "ry"],
      optionalStyle: "fill",
      build: (id, values) => new Ellipse(id, NumberValue.parse(values.cx ?? "0"), NumberValue.parse(values.cy ?? "0"),
        NumberValue.parse(values.rx ?? "0"), NumberValue.parse(values.ry ?? "0")),
    }],
    ["line", {
      parameters: ["x1", "y1", "x2", "y2"],
      optionalStyle: "stroke",
      build: (id, values) => new Line(id, NumberValue.parse(values.x1 ?? "0"), NumberValue.parse(values.y1 ?? "0"),
        NumberValue.parse(values.x2 ?? "0"), NumberValue.parse(values.y2 ?? "0")),
    }],
    ["text", {
      parameters: ["x", "y", "text"],
      build: (id, values, text) => new Text(id, NumberValue.parse(values.x ?? "0"), NumberValue.parse(values.y ?? "0"), text),
    }],
    ["g", {
      parameters: [],
      build: (id) => new Group(id),
    }],
  ]);

  create(type: string, id: string, parameters: readonly string[]): Shape {
    const definition = this.definition(type);
    const required = definition.parameters.length;
    if (parameters.length < required || parameters.length > required + (definition.optionalStyle ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}`);
    }
    const values: Record<string, string> = {};
    definition.parameters.forEach((name, index) => { values[name] = parameters[index]!; });
    if (definition.optionalStyle && parameters[required] !== undefined) values[definition.optionalStyle] = parameters[required]!;
    const content = values.text ?? "";
    delete values.text;
    const shape = definition.build(id, values, content);
    shape.importAttributes(values);
    return shape;
  }

  fromRecord(record: ShapeRecord): Shape {
    const definition = this.definition(record.tag);
    const id = record.attributes.id;
    if (!id) throw new Error(`missing id on <${record.tag}>`);
    const shape = definition.build(id, record.attributes, record.text ?? "");
    shape.validateContent(record.text ?? "");
    shape.importAttributes(record.attributes);
    if (record.children.length) {
      const group = shape.asGroup();
      for (const child of record.children) group.insertChild(this.fromRecord(child));
    }
    return shape;
  }

  private definition(type: string): ShapeDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
}
