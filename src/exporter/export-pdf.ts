import {
  mkdir,
  readFile
} from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { withBrowser } from "./browser";
import {
  measureAndValidateLayout,
  waitForRenderReady,
  type LayoutMeasurement
} from "./layout-checks";

export interface ExportPdfInput {
  url: string;
  pdfPath: string;
}

export type PdfMeasurement = LayoutMeasurement;

export async function exportPdf(
  input: ExportPdfInput
): Promise<PdfMeasurement> {
  await mkdir(path.dirname(input.pdfPath), { recursive: true });

  return withBrowser(1, async ({ page }) => {
    await page.goto(input.url, {
      waitUntil: "domcontentloaded",
      timeout: 15_000
    });

    await waitForRenderReady(page);
    const measurement = await measureAndValidateLayout(page);

    await page.pdf({
      path: input.pdfPath,
      width: `${measurement.cssWidth}px`,
      height: `${measurement.cssHeight}px`,
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    const bytes = await readFile(input.pdfPath);
    if (bytes.length === 0) {
      throw new Error("Generated PDF is empty");
    }

    const pdf = await PDFDocument.load(bytes);
    if (pdf.getPageCount() !== 1) {
      throw new Error(
        "Generated PDF must contain exactly one page"
      );
    }

    return measurement;
  });
}
