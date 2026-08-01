import {
  mkdtemp,
  readFile,
  readdir
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import type { PosterDocument } from "../../src/markdown/document-types";
import { exportPdf } from "../../src/exporter/export-pdf";
import { startRenderServer } from "../../src/server/start-render-server";

const poster: PosterDocument = {
  title: "个人日报",
  dateLabel: "2026-07-09—11",
  sourceName: "2026-07-09-11.md",
  blocks: [
    {
      type: "heading",
      level: 2,
      text: "矢量 PDF"
    },
    {
      type: "paragraph",
      text: "文字和浏览器图形直接写入 PDF。"
    }
  ]
};

test("exports one non-empty custom-size PDF and no PNG", async () => {
  const output = await mkdtemp(
    path.join(os.tmpdir(), "pdr-pdf-")
  );
  const pdfPath = path.join(output, "9-11.pdf");
  const server = await startRenderServer(poster);

  try {
    const result = await exportPdf({
      url: server.url,
      pdfPath
    });
    const bytes = await readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes);

    expect(result.cssWidth).toBe(1080);
    expect(result.cssHeight).toBeGreaterThanOrEqual(1920);
    expect(bytes.length).toBeGreaterThan(0);
    expect(pdf.getPageCount()).toBe(1);
    expect(await readdir(output)).toEqual(["9-11.pdf"]);
  } finally {
    await server.close();
  }
});
