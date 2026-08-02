import { describe, expect, it } from "vitest";
import type { PosterDocument } from "../../src/markdown/document-types";
import { startRenderServer } from "../../src/server/start-render-server";

const document: PosterDocument = {
  title: "个人日报",
  dateLabel: "2026-08-01",
  sourceName: "2026-08-01.md",
  blocks: [
    {
      type: "paragraph",
      text: "继续完成 PDF 长海报。"
    }
  ]
};

describe("startRenderServer", () => {
  it("serves poster JSON from loopback", async () => {
    const server = await startRenderServer(document);

    try {
      expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:/);
      const response = await fetch(`${server.url}/__report-data.json`);
      expect(response.ok).toBe(true);
      expect(await response.json()).toEqual(document);
    } finally {
      await server.close();
    }
  });
});
