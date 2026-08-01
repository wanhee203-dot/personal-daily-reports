export interface ReportManifest {
  source: string;
  sourceHash: string;
  reportDate: string;
  template: {
    name: string;
    version: string;
  };
  generatorVersion: string;
  generatedAt: string;
  render: {
    cssWidth: number;
    cssHeight: number;
    scale: 1 | 2;
    pngWidth: number;
    pngHeight: number;
  };
  outputs: {
    png: "report.png";
    pdf: "report.pdf";
    json: "report.json";
  };
}

export function createManifest(
  input: Omit<ReportManifest, "outputs">
): ReportManifest {
  return {
    ...input,
    outputs: {
      png: "report.png",
      pdf: "report.pdf",
      json: "report.json"
    }
  };
}
