import {
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";
import type {
  MarkdownBlock,
  MarkdownDocument
} from "./document-types";

type ListBlock = Extract<
  MarkdownBlock,
  { type: "list" }
>;

const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

export function parseMarkdown(source: string): MarkdownDocument {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let title = "个人日报";
  let foundTitle = false;
  let paragraph: string[] = [];
  let list: ListBlock | undefined;
  let code:
    | {
        language?: string;
        lines: string[];
      }
    | undefined;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;

    blocks.push({
      type: "paragraph",
      text: paragraph.join(" ").trim()
    });
    paragraph = [];
  };

  const flushList = () => {
    if (list) blocks.push(list);
    list = undefined;
  };

  const flushText = () => {
    flushParagraph();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.replace(/^ {0,3}/, "");

    if (code) {
      if (/^```\s*$/.test(line)) {
        blocks.push({
          type: "code",
          language: code.language,
          code: code.lines.join("\n")
        });
        code = undefined;
      } else {
        code.lines.push(line);
      }
      continue;
    }

    const fence = /^```\s*([^\s`]*)\s*$/.exec(line);
    if (fence) {
      flushText();
      code = {
        language: fence[1] || undefined,
        lines: []
      };
      continue;
    }

    if (line.trim() === "") {
      flushText();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushText();
      const level = heading[1].length as 1 | 2 | 3;
      const text = heading[2].trim();

      if (level === 1 && !foundTitle) {
        title = text;
        foundTitle = true;
      } else {
        blocks.push({ type: "heading", level, text });
      }
      continue;
    }

    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(
      line.trim()
    );
    if (image) {
      flushText();
      blocks.push({
        type: "image",
        alt: image[1],
        src: image[2].trim()
      });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushText();
      blocks.push({
        type: "blockquote",
        text: quote[1].trim()
      });
      continue;
    }

    const unordered = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    const item = unordered ?? ordered;

    if (item) {
      flushParagraph();
      const isOrdered = Boolean(ordered);

      if (list && list.ordered !== isOrdered) {
        flushList();
      }

      list ??= {
        type: "list",
        ordered: isOrdered,
        items: []
      };
      list.items.push(item[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (code) {
    throw new Error("Unclosed fenced code block");
  }

  flushText();

  return {
    title,
    blocks
  };
}

function isOutsideRoot(
  filePath: string,
  projectRoot: string
): boolean {
  const relative = path.relative(projectRoot, filePath);
  return relative.startsWith("..") || path.isAbsolute(relative);
}

export async function parseMarkdownFile(
  filePath: string,
  projectRoot: string
): Promise<MarkdownDocument> {
  const document = parseMarkdown(await readFile(filePath, "utf8"));
  const absoluteRoot = path.resolve(projectRoot);
  const blocks = await Promise.all(
    document.blocks.map(async (block): Promise<MarkdownBlock> => {
      if (block.type !== "image" || block.src.startsWith("data:")) {
        return block;
      }

      if (/^[a-z][a-z0-9+.-]*:/i.test(block.src)) {
        throw new Error(
          `Only local Markdown images are supported: ${block.src}`
        );
      }

      const imagePath = path.resolve(
        path.dirname(filePath),
        block.src
      );

      if (isOutsideRoot(imagePath, absoluteRoot)) {
        throw new Error(
          `Markdown image is outside the project root: ${block.src}`
        );
      }

      const mime = IMAGE_MIME[
        path.extname(imagePath).toLowerCase()
      ];
      if (!mime) {
        throw new Error(`Unsupported image type: ${block.src}`);
      }

      const information = await stat(imagePath);
      if (!information.isFile()) {
        throw new Error(
          `Markdown image is not a file: ${block.src}`
        );
      }

      const bytes = await readFile(imagePath);
      return {
        ...block,
        src: `data:${mime};base64,${bytes.toString("base64")}`
      };
    })
  );

  return {
    ...document,
    blocks
  };
}
