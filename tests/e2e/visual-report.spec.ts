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
    sourceName: "2026-07-30-31.md",
    blocks: [
      ...markdown.blocks,
      {
        type: "code",
        language: "text",
        code: [
          "Mac: VS Code / Codex",
          "        |",
          "        v",
          "Research Literature MCP",
          "   |- Literature discovery",
          "   `- Research analysis"
        ].join("\n")
      }
    ]
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

test("renders fenced code blocks with blueprint typography and alignment", async ({
  page
}) => {
  const fixturePath = path.resolve(
    "tests",
    "fixtures",
    "plain-daily.md"
  );
  const markdown = await parseMarkdownFile(
    fixturePath,
    path.resolve(".")
  );
  const server = await startRenderServer({
    ...markdown,
    dateLabel: "2026-07-30-31",
    sourceName: "2026-07-30-31.md"
  });

  try {
    await page.goto(server.url);
    await page.waitForFunction(
      () => document.body.dataset.renderStatus === "ready"
    );
    const code = page.locator("#daily-report pre code").first();
    await expect(code).toHaveCSS("font-size", "16px");
    await expect(code).toHaveCSS("text-align", "left");

    const fontFamily = await code.evaluate(
      (element) => getComputedStyle(element).fontFamily
    );
    expect(fontFamily).toContain("Cascadia Mono");

    const alignment = await code.evaluate((element) => {
      const codeBox = element.getBoundingClientRect();
      const preBox = element.parentElement!.getBoundingClientRect();
      return Math.abs(
        codeBox.left + codeBox.width / 2 -
          (preBox.left + preBox.width / 2)
      );
    });
    expect(alignment).toBeLessThan(2);
  } finally {
    await server.close();
  }
});
