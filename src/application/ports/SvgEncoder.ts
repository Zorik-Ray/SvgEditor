import type { SvgDocument } from "../../domain/SvgDocument.js";

export interface SvgEncoder {
  encode(document: SvgDocument): string;
}
