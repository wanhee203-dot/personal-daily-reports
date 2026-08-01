import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseMarkdown,
  parseMarkdownFile
} from "../../src/markdown/parse-markdown";

describe("parseMarkdown", () => {
  it("preserves headings, paragraphs, lists, quotes, code, and images", async () => {
    const source = await readFile(
      path.resolve("tests/fixtures/plain-daily.md"),
      "utf8"
    );

    const document = parseMarkdown(source);

    expect(document.title).toBe("2026年7月30—31日日报");
    expect(document.blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "list",
      "blockquote",
      "code",
      "image"
    ]);
    expect(document.blocks).toContainEqual({
      type: "code",
      language: "toml",
      code: 'model_provider = "custom"'
    });
  });

  it("keeps unsupported Markdown as readable paragraph text", () => {
    const document = parseMarkdown("~~保留这段文字~~");

    expect(document.blocks).toEqual([
      {
        type: "paragraph",
        text: "~~保留这段文字~~"
      }
    ]);
  });

  it("rejects an unclosed fenced code block", () => {
    expect(() => parseMarkdown("```ts\nconst value = 1;"))
      .toThrow(/Unclosed fenced code block/);
  });
});

describe("parseMarkdownFile", () => {
  it("embeds a local image without changing its source file", async () => {
    const imagePath = path.resolve(
      "template-reference/figma-reference.png"
    );
    const before = await readFile(imagePath);

    const document = await parseMarkdownFile(
      path.resolve("tests/fixtures/plain-daily.md"),
      path.resolve(".")
    );

    const image = document.blocks.find(
      (block) => block.type === "image"
    );
    expect(image).toMatchObject({
      type: "image",
      alt: "示意图"
    });
    expect(
      image?.type === "image" ? image.src : ""
    ).toMatch(/^data:image\/png;base64,/);
    expect(await readFile(imagePath)).toEqual(before);
  });

  it("rejects images outside the project root", async () => {
    const projectRoot = await mkdtemp(
      path.join(os.tmpdir(), "pdr-markdown-root-")
    );
    const sourceDir = path.join(
      projectRoot,
      "daily",
      "2026-07"
    );
    await mkdir(sourceDir, { recursive: true });

    const outsideName = `${path.basename(projectRoot)}-outside.png`;
    const outsidePath = path.join(
      path.dirname(projectRoot),
      outsideName
    );
    await writeFile(outsidePath, "not-a-real-png", "utf8");

    const sourcePath = path.join(sourceDir, "2026-07-09.md");
    await writeFile(
      sourcePath,
      `![outside](../../../${outsideName})\n`,
      "utf8"
    );

    await expect(
      parseMarkdownFile(sourcePath, projectRoot)
    ).rejects.toThrow(/outside the project root/i);
  });
});
