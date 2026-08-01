import path from "node:path";
import { expect, test } from "@playwright/test";
import { parseReportMarkdown } from "../../src/parser/parse-report";
import { readFile } from "node:fs/promises";
import { startRenderServer } from "../../src/server/start-render-server";

test("matches the approved daily report baseline", async ({ page }) => {
  const fixturePath = path.resolve(
    "tests",
    "fixtures",
    "visual-reference.md"
  );
  const source = await readFile(fixturePath, "utf8");
  const report = parseReportMarkdown(
    source,
    "2026-08-01.md"
  );
  const server = await startRenderServer(report);

  try {
    await page.goto(server.url);
    await page.waitForFunction(
      () => document.body.dataset.renderStatus === "ready"
    );

    await expect(page.locator("#daily-report")).toHaveScreenshot(
      "daily-report-standard.png",
      {
        maxDiffPixelRatio: 0.005,
        animations: "disabled"
      }
    );
  } finally {
    await server.close();
  }
});
