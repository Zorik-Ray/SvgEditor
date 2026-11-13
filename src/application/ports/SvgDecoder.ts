import type { SvgDocument } from "../../domain/SvgDocument.js";

export interface ImportedDocument {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export interface SvgDecoder {
  decode(source: string): ImportedDocument;
}
