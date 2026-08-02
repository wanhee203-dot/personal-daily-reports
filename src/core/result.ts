import type { PdfMeasurement } from "../exporter/export-pdf";
import type { PosterDocument } from "../markdown/document-types";

export type GenerateReportResult =
  | {
      status: "dry-run";
      document: PosterDocument;
      outputPath: string;
      warnings: string[];
    }
  | {
      status: "generated";
      outputPath: string;
      outputDir: string;
      measurement: PdfMeasurement;
      warnings: string[];
    };
