import type { ShapeDetails } from "../application/Inspection.js";

export class ShowPrinter {
  render(details: ShapeDetails): readonly string[] {
    return [
      details.heading,
      ...Object.entries(details.attributes).map(([name, value]) => `  ${name}=${value}`),
      ...(details.text === undefined ? [] : [`  text=${JSON.stringify(details.text)}`]),
    ];
  }
}
