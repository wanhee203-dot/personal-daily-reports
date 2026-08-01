import type { DailyReport } from "../schema/report-types";
import type { ReportManifest } from "../storage/manifest";

export type GenerateReportResult =
  | {
      status: "dry-run";
      report: DailyReport;
      warnings: string[];
    }
  | {
      status: "cached";
      outputDir: string;
      warnings: string[];
    }
  | {
      status: "generated";
      outputDir: string;
      manifest: ReportManifest;
      warnings: string[];
    };
