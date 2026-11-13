import { DOMParser, type Element } from "@xmldom/xmldom";
import type { ImportedDocument, SvgDecoder } from "../application/ports/SvgDecoder.js";
import type { ShapeFactory } from "../application/ShapeFactory.js";
import { SvgDocument } from "../domain/SvgDocument.js";
import type { ShapeRecord } from "../domain/ShapeRecord.js";
import { NumberValue } from "../domain/NumberValue.js";

export class SvgReader implements SvgDecoder {
  constructor(private readonly factory: ShapeFactory) {}

  decode(source: string): ImportedDocument {
    const parsed = new DOMParser({
      onError: (_level, message) => { throw new Error(message); },
    }).parseFromString(source, "application/xml");
    const root = parsed.documentElement;
    if (!root || (root.localName ?? root.tagName) !== "svg") throw new Error("expected an <svg> root");
    if (parsed.doctype) throw new Error("SVG document types are not supported");
    const record = this.record(root);
    if (record.text?.trim()) throw new Error("unexpected text content in <svg>");
    const used = new Set<string>();
    if (record.attributes.id) used.add(record.attributes.id);
    for (const child of this.walk(record.children)) {
      const id = child.attributes.id;
      if (!id) continue;
      if (used.has(id)) throw new Error(`id already exists: ${id}`);
      used.add(id);
    }
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const viewBox = record.attributes.viewBox?.trim().split(/[\s,]+/).map((value) => NumberValue.parse(value));
    if (viewBox && (viewBox.length !== 4 || viewBox[2]! <= 0 || viewBox[3]! <= 0)) throw new Error("invalid viewBox");
    const width = this.dimension(record.attributes.width, viewBox?.[2] ?? 800);
    const height = this.dimension(record.attributes.height, viewBox?.[3] ?? 600);
    const candidate = new SvgDocument(width, height, record.attributes);
    for (const child of record.children) {
      candidate.insert(this.factory.fromRecord(this.assignIds(child, used, counters, warnings)));
    }
    return { document: candidate, warnings };
  }

  private record(element: Element): ShapeRecord {
    if (element.namespaceURI && element.namespaceURI !== "http://www.w3.org/2000/svg") {
      throw new Error(`unsupported SVG namespace: ${element.namespaceURI}`);
    }
    const attributes: Record<string, string> = {};
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      attributes[attribute.name] = attribute.value;
    }
    const children: ShapeRecord[] = [];
    let text = "";
    for (const child of element.childNodes) {
      if (child.nodeType === child.ELEMENT_NODE) children.push(this.record(child as Element));
      else if (child.nodeType === child.TEXT_NODE || child.nodeType === child.CDATA_SECTION_NODE) text += child.nodeValue ?? "";
    }
    return { tag: element.localName ?? element.tagName, attributes, text, children };
  }

  private assignIds(
    record: ShapeRecord,
    used: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): ShapeRecord {
    let id = record.attributes.id;
    if (!id) {
      let sequence = counters.get(record.tag) ?? 1;
      while (used.has(`${record.tag}${sequence}`)) sequence++;
      id = `${record.tag}${sequence}`;
      counters.set(record.tag, sequence + 1);
      used.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${record.tag}>`);
    }
    return {
      ...record,
      attributes: { ...record.attributes, id },
      children: record.children.map((child) => this.assignIds(child, used, counters, warnings)),
    };
  }

  private walk(records: readonly ShapeRecord[]): ShapeRecord[] {
    return records.flatMap((record) => [record, ...this.walk(record.children)]);
  }

  private dimension(value: string | undefined, fallback: number): number {
    return value === undefined ? fallback : NumberValue.positive(value.trim().replace(/px$/, ""), "canvas dimension");
  }
}
