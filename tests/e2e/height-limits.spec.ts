import path from "node:path";
import { expect, test } from "@playwright/test";
import type {
  MarkdownBlock,
  PosterDocument
} from "../../src/markdown/document-types";
import { exportPdf } from "../../src/exporter/export-pdf";
import { startRenderServer } from "../../src/server/start-render-server";

const longText = "超长内容用于验证海报高度边界。".repeat(28);

function makePoster(paragraphCount: number): PosterDocument {
  const blocks: MarkdownBlock[] = Array.from(
    { length: paragraphCount },
    () => ({
      type: "paragraph",
      text: longText
    })
  );

  return {
    title: "超长日报高度验证",
    dateLabel: "2026-08-01",
    sourceName: "2026-08-01.md",
    blocks
  };
}

test("warns for a long poster below the hard maximum", async () => {
  const server = await startRenderServer(makePoster(35));

  try {
    const result = await exportPdf({
      url: server.url,
      pdfPath: path.resolve("test-results/long-report.pdf")
    });

    expect(result.cssHeight).toBeGreaterThan(10_000);
    expect(result.cssHeight).toBeLessThanOrEqual(16_000);
    expect(result.warning).toMatch(/10000/);
  } finally {
    await server.close();
  }
});

test("rejects a poster above the hard maximum", async () => {
  const server = await startRenderServer(makePoster(70));

  try {
    await expect(
      exportPdf({
        url: server.url,
        pdfPath: path.resolve(
          "test-results/hard-limit-report.pdf"
        )
      })
    ).rejects.toThrow(/exceeds 16000px/);
  } finally {
    await server.close();
  }
});
