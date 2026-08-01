import path from "node:path";
import { expect, test } from "@playwright/test";
import type { PosterDocument } from "../../src/markdown/document-types";
import { parseMarkdownFile } from "../../src/markdown/parse-markdown";
import { startRenderServer } from "../../src/server/start-render-server";

test("matches the approved long-poster baseline", async ({ page }) => {
  const fixturePath = path.resolve(
    "tests",
    "fixtures",
    "plain-daily.md"
  );
  const markdown = await parseMarkdownFile(
    fixturePath,
    path.resolve(".")
  );
  const poster: PosterDocument = {
    ...markdown,
    dateLabel: "2026-07-30—31",
    sourceName: "2026-07-30-31.md"
  };
  const server = await startRenderServer(poster);

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
