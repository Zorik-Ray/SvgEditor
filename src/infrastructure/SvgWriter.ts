import type { SvgEncoder } from "../application/ports/SvgEncoder.js";
import type { SvgDocument } from "../domain/SvgDocument.js";
import type { ShapeRecord } from "../domain/ShapeRecord.js";

export class SvgWriter implements SvgEncoder {
  encode(document: SvgDocument): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${this.element(document.toRecord(), 0)}\n`;
  }

  private element(record: ShapeRecord, depth: number): string {
    const indentation = "  ".repeat(depth);
    const attributes = Object.entries(record.attributes)
      .map(([name, value]) => `${name}="${this.escape(value, true)}"`).join(" ");
    const opening = `${indentation}<${record.tag}${attributes ? ` ${attributes}` : ""}`;
    if (record.text !== undefined) return `${opening}>${this.escape(record.text)}</${record.tag}>`;
    if (!record.children.length) return `${opening}/>`;
    const children = record.children.map((child) => this.element(child, depth + 1)).join("\n");
    return `${opening}>\n${children}\n${indentation}</${record.tag}>`;
  }

  private escape(value: string, attribute = false): string {
    if (/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value)) {
      throw new Error("invalid XML character");
    }
    let escaped = value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\r", "&#13;");
    if (attribute) escaped = escaped.replaceAll('"', "&quot;").replaceAll("\n", "&#10;").replaceAll("\t", "&#9;");
    return escaped;
  }
}
