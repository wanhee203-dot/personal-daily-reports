import { mkdir } from "node:fs/promises";
import path from "node:path";
import { withBrowser } from "./browser";
import {
  measureAndValidateLayout,
  waitForRenderReady
} from "./layout-checks";

export interface ExportArtifactsInput {
  url: string;
  pngPath: string;
  pdfPath: string;
  scale: 1 | 2;
}

export interface ExportMeasurement {
  cssWidth: number;
  cssHeight: number;
  pngWidth: number;
  pngHeight: number;
  warning?: string;
}

export async function exportArtifacts(
  input: ExportArtifactsInput
): Promise<ExportMeasurement> {
  await mkdir(path.dirname(input.pngPath), { recursive: true });
  await mkdir(path.dirname(input.pdfPath), { recursive: true });

  return withBrowser(input.scale, async ({ page }) => {
    await page.goto(input.url, {
      waitUntil: "domcontentloaded",
      timeout: 15_000
    });

    await waitForRenderReady(page);
    const measurement = await measureAndValidateLayout(page);
    const report = page.locator("#daily-report");

    await report.screenshot({
      path: input.pngPath,
      type: "png",
      animations: "disabled",
      caret: "hide"
    });

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

    return {
      ...measurement,
      pngWidth: measurement.cssWidth * input.scale,
      pngHeight: measurement.cssHeight * input.scale
    };
  });
}
