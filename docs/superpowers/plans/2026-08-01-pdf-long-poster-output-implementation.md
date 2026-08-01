# PDF Long-Poster Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read ordinary Markdown reports from `daily/YYYY-MM/` and generate exactly one clear, single-page vector PDF at `daily/YYYY-MM/images/<day-or-range>.pdf`.

**Architecture:** Replace the production path from strict report-schema parsing to a small dependency-free Markdown document model rendered by a dedicated React poster page. Resolve output identity entirely from the validated source path, export the measured 1080 px-wide poster directly with Chromium PDF, validate the single-page PDF, and atomically replace only the target PDF.

**Tech Stack:** Node.js 24, TypeScript, React 19, Vite 8, Playwright Chromium, Vitest, Testing Library, pdf-lib.

## Global Constraints

- Input is restricted to `daily/YYYY-MM/YYYY-MM-DD.md` or `daily/YYYY-MM/YYYY-MM-DD-DD.md` inside the selected project root.
- Output is exactly one PDF in the source month's `images/` directory; no PNG, JSON, manifest, cache artifact, or date subdirectory may remain.
- PDF file names omit leading zeros: `2026-08-01.md` becomes `1.pdf`; `2026-07-09-11.md` becomes `9-11.pdf`.
- Poster logical width is exactly 1080 px; height is content-driven, single-page, and bounded by the existing 16,000 px safety limit.
- Text and browser-rendered shapes must remain vector PDF content; local bitmap images retain their source bytes and resolution.
- Source Markdown is read-only and never rewritten.
- No new npm dependency is allowed.
- Production changes follow strict test-first red-green-refactor cycles.

---

### Task 1: Validate daily source identity and resolve the numeric PDF path

**Files:**
- Create: `src/source/daily-source.ts`
- Modify: `src/storage/paths.ts`
- Create: `tests/source/daily-source.test.ts`
- Modify: `tests/storage/storage.test.ts`

**Interfaces:**
- Produces `DailySourceIdentity` with `year`, `month`, `startDay`, optional `endDay`, `dateLabel`, `outputStem`, and `sourceDir`.
- Produces `resolveDailySource(sourcePath: string, projectRoot: string): DailySourceIdentity`.
- Produces `resolveReportPaths(sourcePath: string, projectRoot: string, runId: string): ReportPaths` with `tempPdfPath`, `finalOutputDir`, and `finalPdfPath`.
- Consumed by Task 5 to label and publish the poster.

- [ ] **Step 1: Write failing source-identity tests**

```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDailySource } from "../../src/source/daily-source";

describe("resolveDailySource", () => {
  const root = path.resolve("H:/Workshop/PDR/personal-daily-reports");

  it("maps a zero-padded single day to a numeric output stem", () => {
    const source = path.join(root, "daily", "2026-08", "2026-08-01.md");
    expect(resolveDailySource(source, root)).toMatchObject({
      year: "2026",
      month: "08",
      startDay: 1,
      endDay: undefined,
      dateLabel: "2026-08-01",
      outputStem: "1"
    });
  });

  it("maps a same-month day range to the requested numeric range", () => {
    const source = path.join(root, "daily", "2026-07", "2026-07-09-11.md");
    expect(resolveDailySource(source, root)).toMatchObject({
      startDay: 9,
      endDay: 11,
      dateLabel: "2026-07-09—11",
      outputStem: "9-11"
    });
  });

  it.each([
    "reports/2026-08-01.md",
    "daily/2026-07/2026-08-01.md",
    "daily/2026-02/2026-02-30.md",
    "daily/2026-07/2026-07-11-09.md"
  ])("rejects an invalid daily source path: %s", (relative) => {
    expect(() => resolveDailySource(path.join(root, relative), root)).toThrow();
  });
});
```

- [ ] **Step 2: Run the source test and verify RED**

Run: `npm.cmd test -- tests/source/daily-source.test.ts`

Expected: FAIL because `src/source/daily-source.ts` does not exist.

- [ ] **Step 3: Implement strict source identity parsing**

```ts
export interface DailySourceIdentity {
  year: string;
  month: string;
  startDay: number;
  endDay?: number;
  dateLabel: string;
  outputStem: string;
  sourceDir: string;
}

const DAILY_FILE = /^(\d{4})-(\d{2})-(\d{2})(?:-(\d{2}))?\.md$/i;

export function resolveDailySource(
  sourcePath: string,
  projectRoot: string
): DailySourceIdentity {
  const absoluteSource = path.resolve(sourcePath);
  const absoluteRoot = path.resolve(projectRoot);
  const relative = path.relative(path.join(absoluteRoot, "daily"), absoluteSource);
  const parts = relative.split(path.sep);
  const match = DAILY_FILE.exec(path.basename(absoluteSource));

  const invalid = () => {
    throw new Error(
      `Invalid daily source path: ${absoluteSource}. Expected daily/YYYY-MM/YYYY-MM-DD.md or daily/YYYY-MM/YYYY-MM-DD-DD.md`
    );
  };

  if (parts.length !== 2 || relative.startsWith("..") || path.isAbsolute(relative) || !match) {
    invalid();
  }

  const [, year, month, startText, endText] = match;
  if (parts[0] !== `${year}-${month}`) invalid();

  const monthNumber = Number(month);
  const startDay = Number(startText);
  const endDay = endText === undefined ? undefined : Number(endText);
  if (monthNumber < 1 || monthNumber > 12) invalid();
  const maxDay = new Date(Number(year), monthNumber, 0).getDate();
  if (startDay < 1 || startDay > maxDay) invalid();
  if (endDay !== undefined && (endDay < startDay || endDay > maxDay)) invalid();

  return {
    year,
    month,
    startDay,
    endDay,
    dateLabel: endDay === undefined
      ? `${year}-${month}-${startText}`
      : `${year}-${month}-${startText}—${endDay}`,
    outputStem: endDay === undefined ? `${startDay}` : `${startDay}-${endDay}`,
    sourceDir: path.dirname(absoluteSource)
  };
}
```

The error message for every rejected input must include the received absolute source path and the accepted patterns.

- [ ] **Step 4: Run the source test and verify GREEN**

Run: `npm.cmd test -- tests/source/daily-source.test.ts`

Expected: PASS with 4 cases.

- [ ] **Step 5: Write the failing output-path test**

```ts
it("resolves only a temporary and final PDF path", () => {
  const root = path.resolve("H:/Workshop/PDR/personal-daily-reports");
  const source = path.join(root, "daily", "2026-07", "2026-07-30-31.md");
  const paths = resolveReportPaths(source, root, "run-1");

  expect(paths.finalOutputDir).toBe(path.join(root, "daily", "2026-07", "images"));
  expect(paths.finalPdfPath).toBe(path.join(root, "daily", "2026-07", "images", "30-31.pdf"));
  expect(paths.tempPdfPath).toBe(path.join(root, ".daily-report-cache", "run-1", "30-31.pdf"));
  expect(Object.keys(paths)).not.toContain("tempPngPath");
  expect(Object.keys(paths)).not.toContain("tempJsonPath");
  expect(Object.keys(paths)).not.toContain("tempManifestPath");
});
```

- [ ] **Step 6: Run the storage test and verify RED**

Run: `npm.cmd test -- tests/storage/storage.test.ts`

Expected: FAIL because the current resolver writes to `reports/rendered/` and exposes four artifacts.

- [ ] **Step 7: Replace the path resolver with the PDF-only contract**

```ts
export interface ReportPaths {
  projectRoot: string;
  sourcePath: string;
  cacheRoot: string;
  runRoot: string;
  tempPdfPath: string;
  finalOutputDir: string;
  finalPdfPath: string;
}

export function resolveReportPaths(
  sourcePath: string,
  projectRoot: string,
  runId: string
): ReportPaths {
  const identity = resolveDailySource(sourcePath, projectRoot);
  const cacheRoot = path.join(projectRoot, ".daily-report-cache");
  const runRoot = path.join(cacheRoot, runId);
  const finalOutputDir = path.join(identity.sourceDir, "images");
  return {
    projectRoot,
    sourcePath,
    cacheRoot,
    runRoot,
    tempPdfPath: path.join(runRoot, `${identity.outputStem}.pdf`),
    finalOutputDir,
    finalPdfPath: path.join(finalOutputDir, `${identity.outputStem}.pdf`)
  };
}
```

- [ ] **Step 8: Run focused tests and commit**

Run: `npm.cmd test -- tests/source/daily-source.test.ts tests/storage/storage.test.ts`

Expected: PASS.

```powershell
git add src/source/daily-source.ts src/storage/paths.ts tests/source/daily-source.test.ts tests/storage/storage.test.ts
git commit -m "feat: resolve daily PDF output paths"
```

---

### Task 2: Parse ordinary Markdown into a safe poster document model

**Files:**
- Create: `src/markdown/document-types.ts`
- Create: `src/markdown/parse-markdown.ts`
- Create: `tests/markdown/parse-markdown.test.ts`
- Create: `tests/fixtures/plain-daily.md`

**Interfaces:**
- Produces `MarkdownBlock`, `MarkdownDocument`, and `PosterDocument` discriminated unions/interfaces.
- Produces `parseMarkdown(source: string): MarkdownDocument`.
- Produces `parseMarkdownFile(filePath: string, projectRoot: string): Promise<MarkdownDocument>`; local images are converted to data URLs only when they remain inside `projectRoot`.
- Task 3 consumes raw inline Markdown text from each block and renders safe React nodes.

- [ ] **Step 1: Define the test fixture and failing parser tests**

`tests/fixtures/plain-daily.md` must contain one H1, one H2, two-line paragraph, unordered list, ordered list, blockquote, fenced TOML code, inline bold/code/link syntax, and `![示意图](../../template-reference/figma-reference.png)` as an independent local image reference.

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../../src/markdown/parse-markdown";

describe("parseMarkdown", () => {
  it("preserves headings, paragraphs, lists, quotes, code, and images", async () => {
    const source = await readFile(path.resolve("tests/fixtures/plain-daily.md"), "utf8");
    const document = parseMarkdown(source);

    expect(document.title).toBe("2026年7月30—31日日报");
    expect(document.blocks.map((block) => block.type)).toEqual([
      "heading", "paragraph", "list", "list",
      "blockquote", "code", "image"
    ]);
    expect(document.blocks).toContainEqual({
      type: "code",
      language: "toml",
      code: "model_provider = \"custom\""
    });
  });

  it("keeps unsupported Markdown as readable paragraph text", () => {
    const document = parseMarkdown("~~保留这段文字~~");
    expect(document.blocks).toEqual([
      { type: "paragraph", text: "~~保留这段文字~~" }
    ]);
  });
});
```

- [ ] **Step 2: Run parser tests and verify RED**

Run: `npm.cmd test -- tests/markdown/parse-markdown.test.ts`

Expected: FAIL because the Markdown model and parser do not exist.

- [ ] **Step 3: Implement the document model**

```ts
export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "image"; alt: string; src: string };

export interface MarkdownDocument {
  title: string;
  blocks: MarkdownBlock[];
}

export interface PosterDocument extends MarkdownDocument {
  dateLabel: string;
  sourceName: string;
}
```

- [ ] **Step 4: Implement the dependency-free block parser**

The parser must normalize CRLF, flush accumulated paragraphs and lists at blank lines or block changes, accept up to three leading spaces before a fence or list marker, join adjacent paragraph lines with a single space, remove the first H1 from body blocks after using it as `title`, and use `个人日报` when no H1 exists.

Recognizers must be evaluated in this order: fenced code, heading, independent image, blockquote, unordered list, ordered list, paragraph. Image syntax is `![alt](path)` on its own trimmed line.

```ts
export function parseMarkdown(source: string): MarkdownDocument {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let title = "个人日报";
  let foundTitle = false;
  let paragraph: string[] = [];
  let list: Extract<MarkdownBlock, { type: "list" }> | undefined;
  let code: { language?: string; lines: string[] } | undefined;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
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
        blocks.push({ type: "code", language: code.language, code: code.lines.join("\n") });
        code = undefined;
      } else {
        code.lines.push(raw.replace(/^ {0,3}/, ""));
      }
      continue;
    }

    const fence = /^```\s*([^\s`]*)\s*$/.exec(line);
    if (fence) {
      flushText();
      code = { language: fence[1] || undefined, lines: [] };
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

    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
    if (image) {
      flushText();
      blocks.push({ type: "image", alt: image[1], src: image[2].trim() });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushText();
      blocks.push({ type: "blockquote", text: quote[1].trim() });
      continue;
    }

    const unordered = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    const item = unordered ?? ordered;
    if (item) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) flushList();
      list ??= { type: "list", ordered: isOrdered, items: [] };
      list.items.push(item[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (code) throw new Error("Unclosed fenced code block");
  flushText();
  return { title, blocks };
}
```

- [ ] **Step 5: Run parser tests and verify GREEN**

Run: `npm.cmd test -- tests/markdown/parse-markdown.test.ts`

Expected: PASS.

- [ ] **Step 6: Write the failing local-image safety tests**

```ts
it("embeds a local image without changing its bytes", async () => {
  const document = await parseMarkdownFile(sourcePath, projectRoot);
  const image = document.blocks.find((block) => block.type === "image");
  expect(image).toMatchObject({ type: "image", alt: "示意图" });
  expect(image && image.type === "image" ? image.src : "").toMatch(
    /^data:image\/png;base64,/
  );
});

it("rejects images outside the project root", async () => {
  await expect(parseMarkdownFile(sourcePathWithTraversal, projectRoot))
    .rejects.toThrow(/outside the project root/i);
});
```

- [ ] **Step 7: Implement image resolution**

`parseMarkdownFile` must read UTF-8, call `parseMarkdown`, resolve non-data image paths relative to the Markdown file, reject `http:`, `https:`, unsupported extensions, missing files, directories, and any resolved path outside `projectRoot`, then replace the source with `data:<mime>;base64,<bytes>`. Supported MIME mappings are PNG, JPEG, GIF, WebP, and SVG.

```ts
const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

export async function parseMarkdownFile(
  filePath: string,
  projectRoot: string
): Promise<MarkdownDocument> {
  const document = parseMarkdown(await readFile(filePath, "utf8"));
  const root = path.resolve(projectRoot);
  const blocks = await Promise.all(document.blocks.map(async (block) => {
    if (block.type !== "image" || block.src.startsWith("data:")) return block;
    if (/^[a-z][a-z0-9+.-]*:/i.test(block.src)) {
      throw new Error(`Only local Markdown images are supported: ${block.src}`);
    }
    const imagePath = path.resolve(path.dirname(filePath), block.src);
    const relative = path.relative(root, imagePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Markdown image is outside the project root: ${block.src}`);
    }
    const mime = IMAGE_MIME[path.extname(imagePath).toLowerCase()];
    if (!mime) throw new Error(`Unsupported image type: ${block.src}`);
    const info = await stat(imagePath);
    if (!info.isFile()) throw new Error(`Markdown image is not a file: ${block.src}`);
    const bytes = await readFile(imagePath);
    return { ...block, src: `data:${mime};base64,${bytes.toString("base64")}` };
  }));
  return { ...document, blocks };
}
```

- [ ] **Step 8: Run focused tests and commit**

Run: `npm.cmd test -- tests/markdown/parse-markdown.test.ts`

Expected: PASS.

```powershell
git add src/markdown tests/markdown tests/fixtures/plain-daily.md
git commit -m "feat: parse ordinary daily markdown"
```

---

### Task 3: Render the Markdown document as a 1080 px long poster

**Files:**
- Create: `src/template/MarkdownPosterPage.tsx`
- Create: `src/template/components/MarkdownContent.tsx`
- Create: `src/template/components/InlineMarkdown.tsx`
- Create: `src/template/styles/poster.css`
- Modify: `src/app/main.tsx`
- Modify: `src/server/start-render-server.ts`
- Create: `tests/components/MarkdownPosterPage.test.tsx`
- Modify: `tests/server/start-render-server.test.ts`
- Modify: `tests/e2e/visual-report.spec.ts`
- Replace: `tests/e2e/visual-report.spec.ts-snapshots/daily-report-standard-win32.png`

**Interfaces:**
- Consumes `PosterDocument` from Task 2.
- Produces `MarkdownPosterPage({ document }: { document: PosterDocument }): React.JSX.Element` with root `#daily-report`.
- Produces `renderInlineMarkdown(text: string): React.ReactNode[]` and safe URL handling.
- Changes `startRenderServer(document: PosterDocument): Promise<RenderServer>` while preserving loopback-only serving and `data-render-status` readiness.
- Task 4 measures and prints `#daily-report` unchanged.

- [ ] **Step 1: Write failing component tests**

```tsx
it("renders poster metadata and every Markdown block", () => {
  render(<MarkdownPosterPage document={poster} />);
  expect(screen.getByTestId("daily-report")).toHaveAttribute("id", "daily-report");
  expect(screen.getByRole("heading", { name: "研究工作日报" })).toBeInTheDocument();
  expect(screen.getByText("2026-07-30—31")).toBeInTheDocument();
  expect(screen.getByText("model_provider = \"custom\"")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "示意图" })).toHaveAttribute(
    "src",
    expect.stringMatching(/^data:image\/png;base64,/)
  );
});

it("renders safe inline formatting without executing raw HTML", () => {
  render(<InlineMarkdown text={'**加粗** `code` [链接](https://example.com) <script>alert(1)</script>'} />);
  expect(screen.getByText("加粗").tagName).toBe("STRONG");
  expect(screen.getByText("code").tagName).toBe("CODE");
  expect(screen.getByRole("link", { name: "链接" })).toHaveAttribute("href", "https://example.com");
  expect(globalThis.document.querySelector("script")).toBeNull();
});
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm.cmd test -- tests/components/MarkdownPosterPage.test.tsx`

Expected: FAIL because the poster components do not exist.

- [ ] **Step 3: Implement safe inline rendering and block components**

Use React elements rather than `dangerouslySetInnerHTML`. Tokenize inline code, bold, italic, and links; preserve unmatched delimiters as text. Permit only `http:`, `https:`, and `mailto:` link protocols. Render block types with semantic `h1`–`h3`, `p`, `ul`/`ol`, `blockquote`, `pre > code`, and `figure > img` elements.

```tsx
const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function safeHref(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export function renderInlineMarkdown(text: string): React.ReactNode[] {
  return text.split(TOKEN).filter(Boolean).map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (link) {
      const href = safeHref(link[2]);
      return href
        ? <a key={index} href={href}>{link[1]}</a>
        : <span key={index}>{token}</span>;
    }
    return token;
  });
}

export function InlineMarkdown({ text }: { text: string }) {
  return <>{renderInlineMarkdown(text)}</>;
}
```

```tsx
export function MarkdownContent({ blocks }: { blocks: MarkdownBlock[] }) {
  return (
    <article className="poster-content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "heading") {
          const Heading = `h${block.level}` as "h1" | "h2" | "h3";
          return <Heading key={key}><InlineMarkdown text={block.text} /></Heading>;
        }
        if (block.type === "paragraph") return <p key={key}><InlineMarkdown text={block.text} /></p>;
        if (block.type === "blockquote") return <blockquote key={key}><InlineMarkdown text={block.text} /></blockquote>;
        if (block.type === "code") return <pre key={key}><code data-language={block.language}>{block.code}</code></pre>;
        if (block.type === "image") return <figure key={key}><img src={block.src} alt={block.alt} /></figure>;
        const List = block.ordered ? "ol" : "ul";
        return <List key={key}>{block.items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown text={item} /></li>)}</List>;
      })}
    </article>
  );
}
```

- [ ] **Step 4: Implement the poster shell and CSS**

```tsx
export function MarkdownPosterPage({ document }: { document: PosterDocument }) {
  return (
    <main id="daily-report" data-testid="daily-report" className="report-page poster-page">
      <header className="poster-header">
        <span>PERSONAL DAILY REPORT</span>
        <h1>{document.title}</h1>
        <p>{document.dateLabel}</p>
      </header>
      <MarkdownContent blocks={document.blocks} />
      <footer className="poster-footer">{document.sourceName}</footer>
    </main>
  );
}
```

The CSS must reuse `tokens.css`, keep `width: var(--report-width)`, `min-height: var(--report-min-height)`, `height: auto`, use only content-flow positioning for body content, avoid `overflow: hidden` on text containers, set `pre { white-space: pre-wrap; overflow-wrap: anywhere; }`, constrain images to `max-width: 100%; height: auto`, and add print color preservation with `print-color-adjust: exact`.

- [ ] **Step 5: Run component tests and verify GREEN**

Run: `npm.cmd test -- tests/components/MarkdownPosterPage.test.tsx`

Expected: PASS.

- [ ] **Step 6: Write failing server/app tests and update their payload**

Change server tests to pass a `PosterDocument` and assert `/__report-data.json` returns it exactly. Change the visual test to parse `plain-daily.md`, augment it with `dateLabel` and `sourceName`, and expect the new poster root.

Run: `npm.cmd test -- tests/server/start-render-server.test.ts`

Expected: FAIL because the server and app still use `DailyReport`.

- [ ] **Step 7: Change the render server and app to `PosterDocument`**

Update only the payload type, bootstrap cast, and rendered component. Preserve loopback binding, no-store JSON response, font/image readiness, and render error reporting.

```tsx
// src/app/main.tsx
const document = (await response.json()) as PosterDocument;
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MarkdownPosterPage document={document} />
  </React.StrictMode>
);
```

```ts
// src/server/start-render-server.ts
export async function startRenderServer(
  document: PosterDocument
): Promise<RenderServer> {
  const port = await getPort();
  const json = JSON.stringify(document);
  const vite = await createServer({
    server: { host: "127.0.0.1", port, strictPort: true },
    appType: "spa",
    logLevel: "error",
    plugins: [{
      name: "daily-report-data",
      configureServer(server) {
        server.middlewares.use("/__report-data.json", (_request, response) => {
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.setHeader("Cache-Control", "no-store");
          response.end(json);
        });
      }
    }]
  });
  await vite.listen();
  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => vite.close()
  };
}
```

- [ ] **Step 8: Run unit tests, refresh the visual baseline, and commit**

Run: `npm.cmd test -- tests/components/MarkdownPosterPage.test.tsx tests/server/start-render-server.test.ts`

Run: `npx.cmd playwright test tests/e2e/visual-report.spec.ts --update-snapshots`

Expected: all focused tests PASS and one reviewed 1080 px-wide poster snapshot replaces the old renderer snapshot.

```powershell
git add src/app/main.tsx src/server/start-render-server.ts src/template tests/components/MarkdownPosterPage.test.tsx tests/server/start-render-server.test.ts tests/e2e/visual-report.spec.ts tests/e2e/visual-report.spec.ts-snapshots
git commit -m "feat: render markdown as a long poster"
```

---

### Task 4: Export and validate one vector PDF without a PNG screenshot

**Files:**
- Create: `src/exporter/export-pdf.ts`
- Create: `tests/e2e/export-pdf.spec.ts`
- Modify: `tests/e2e/height-limits.spec.ts`
- Delete: `src/exporter/export-artifacts.ts`
- Delete: `tests/e2e/export-artifacts.spec.ts`

**Interfaces:**
- Produces `exportPdf(input: { url: string; pdfPath: string }): Promise<PdfMeasurement>`.
- Produces `PdfMeasurement` with `cssWidth`, `cssHeight`, and optional `warning`; it contains no PNG dimensions.
- Uses existing `waitForRenderReady` and `measureAndValidateLayout` and existing `withBrowser(1, operation)` internally.
- Task 5 consumes `exportPdf` and publishes its validated temporary file.

- [ ] **Step 1: Write the failing PDF-only export test**

```ts
test("exports one non-empty custom-size PDF and no PNG", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "pdr-pdf-"));
  const pdfPath = path.join(output, "9-11.pdf");
  const server = await startRenderServer(document);
  try {
    const result = await exportPdf({ url: server.url, pdfPath });
    const bytes = await readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes);
    expect(result.cssWidth).toBe(1080);
    expect(result.cssHeight).toBeGreaterThanOrEqual(1920);
    expect(pdf.getPageCount()).toBe(1);
    expect(await readdir(output)).toEqual(["9-11.pdf"]);
  } finally {
    await server.close();
  }
});
```

- [ ] **Step 2: Run the Playwright test and verify RED**

Run: `npx.cmd playwright test tests/e2e/export-pdf.spec.ts`

Expected: FAIL because `exportPdf` does not exist.

- [ ] **Step 3: Implement direct Chromium PDF export and validation**

```ts
export async function exportPdf(input: ExportPdfInput): Promise<PdfMeasurement> {
  await mkdir(path.dirname(input.pdfPath), { recursive: true });
  return withBrowser(1, async ({ page }) => {
    await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await waitForRenderReady(page);
    const measurement = await measureAndValidateLayout(page);
    await page.pdf({
      path: input.pdfPath,
      width: `${measurement.cssWidth}px`,
      height: `${measurement.cssHeight}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    const bytes = await readFile(input.pdfPath);
    if (bytes.length === 0) throw new Error("Generated PDF is empty");
    const pdf = await PDFDocument.load(bytes);
    if (pdf.getPageCount() !== 1) throw new Error("Generated PDF must contain exactly one page");
    return measurement;
  });
}
```

Do not call `page.screenshot()` and do not accept a scale option.

- [ ] **Step 4: Run the PDF export test and verify GREEN**

Run: `npx.cmd playwright test tests/e2e/export-pdf.spec.ts`

Expected: PASS; the temporary directory contains only the PDF.

- [ ] **Step 5: Update height-limit tests to use `PosterDocument` and `exportPdf`**

Keep both existing behavioral checks: height over 10,000 px returns a warning, and height over 16,000 px rejects before a PDF is accepted. Generate repeated paragraph blocks rather than fixed-schema projects.

Delete the obsolete combined PNG/PDF exporter and its test after the new PDF exporter is green. Confirm `rg "exportArtifacts|report\.screenshot" src tests` returns no matches.

- [ ] **Step 6: Run exporter tests and commit**

Run: `npx.cmd playwright test tests/e2e/export-pdf.spec.ts tests/e2e/height-limits.spec.ts`

Expected: PASS.

```powershell
git add src/exporter/export-pdf.ts tests/e2e/export-pdf.spec.ts tests/e2e/height-limits.spec.ts
git rm src/exporter/export-artifacts.ts tests/e2e/export-artifacts.spec.ts
git commit -m "feat: export vector poster PDF only"
```

---

### Task 5: Integrate PDF-only generation with atomic file replacement

**Files:**
- Create: `src/storage/publish-pdf.ts`
- Modify: `src/core/generate-report.ts`
- Modify: `src/core/result.ts`
- Modify: `tests/core/generate-report.test.ts`
- Create: `tests/storage/publish-pdf.test.ts`

**Interfaces:**
- Produces `publishPdf(tempPdfPath: string, finalPdfPath: string): Promise<void>` with rollback.
- `generateReport(options)` accepts `{ sourcePath, projectRoot, dryRun, verbose }`; `scale` and `force` are removed.
- Generated result is `{ status: "generated"; outputPath; outputDir; measurement; warnings }`.
- Dry-run result is `{ status: "dry-run"; document; outputPath; warnings }` and writes nothing.

- [ ] **Step 1: Write failing atomic-publish tests**

```ts
it("replaces an existing PDF", async () => {
  await writeFile(tempPdf, "new");
  await mkdir(path.dirname(finalPdf), { recursive: true });
  await writeFile(finalPdf, "old");
  await publishPdf(tempPdf, finalPdf);
  expect(await readFile(finalPdf, "utf8")).toBe("new");
});

it("keeps the existing PDF when the temporary file is missing", async () => {
  await mkdir(path.dirname(finalPdf), { recursive: true });
  await writeFile(finalPdf, "old");
  await expect(publishPdf(tempPdf, finalPdf)).rejects.toThrow();
  expect(await readFile(finalPdf, "utf8")).toBe("old");
});
```

- [ ] **Step 2: Run publish tests and verify RED**

Run: `npm.cmd test -- tests/storage/publish-pdf.test.ts`

Expected: FAIL because `publishPdf` does not exist.

- [ ] **Step 3: Implement single-file backup, rename, and rollback**

Create the destination directory; ensure the temporary path is a non-empty file before touching the destination; remove only a stale `<final>.backup`; rename an existing final file to backup; rename temp to final; remove backup on success. On failure, remove only a partially published final and restore the backup. Never remove the source Markdown or the whole `images/` directory.

```ts
async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function publishPdf(
  tempPdfPath: string,
  finalPdfPath: string
): Promise<void> {
  const tempInfo = await stat(tempPdfPath);
  if (!tempInfo.isFile() || tempInfo.size === 0) {
    throw new Error(`Temporary PDF is missing or empty: ${tempPdfPath}`);
  }

  await mkdir(path.dirname(finalPdfPath), { recursive: true });
  const backup = `${finalPdfPath}.backup`;
  await rm(backup, { force: true });
  const hadExisting = await exists(finalPdfPath);

  try {
    if (hadExisting) await rename(finalPdfPath, backup);
    await rename(tempPdfPath, finalPdfPath);
    await rm(backup, { force: true });
  } catch (error) {
    if (await exists(finalPdfPath)) await rm(finalPdfPath, { force: true });
    if (hadExisting && await exists(backup)) await rename(backup, finalPdfPath);
    throw error;
  }
}
```

- [ ] **Step 4: Run publish tests and verify GREEN**

Run: `npm.cmd test -- tests/storage/publish-pdf.test.ts`

Expected: PASS.

- [ ] **Step 5: Replace core generation tests with the PDF-only contract**

Dry-run test setup must use `daily/2026-07/2026-07-30-31.md`, assert `result.outputPath` ends in `daily/2026-07/images/30-31.pdf`, and assert no `images/` or `.daily-report-cache/` directory exists. A generated-output test belongs in Task 6 because it needs Chromium.

Run: `npm.cmd test -- tests/core/generate-report.test.ts`

Expected: FAIL because the current core expects fixed schema data, cache fingerprints, scale, PNG, JSON, and manifest.

- [ ] **Step 6: Implement the minimal PDF-only generation flow**

```ts
const identity = resolveDailySource(sourcePath, options.projectRoot);
const document = await parseMarkdownFile(sourcePath, options.projectRoot);
const poster: PosterDocument = {
  ...document,
  dateLabel: identity.dateLabel,
  sourceName: path.basename(sourcePath)
};
const paths = resolveReportPaths(sourcePath, options.projectRoot, runId);

if (options.dryRun) {
  return { status: "dry-run", document: poster, outputPath: paths.finalPdfPath, warnings: [] };
}

await mkdir(paths.runRoot, { recursive: true });
const server = await startRenderServer(poster);
try {
  const measurement = await exportPdf({ url: server.url, pdfPath: paths.tempPdfPath });
  await publishPdf(paths.tempPdfPath, paths.finalPdfPath);
  return {
    status: "generated",
    outputPath: paths.finalPdfPath,
    outputDir: paths.finalOutputDir,
    measurement,
    warnings: measurement.warning ? [measurement.warning] : []
  };
} finally {
  await server.close();
  await rm(paths.runRoot, { recursive: true, force: true });
  await rmdir(paths.cacheRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOTEMPTY" && error.code !== "ENOENT") throw error;
  });
}
```

Do not call the old fixed parser, hash/cache check, PNG exporter, JSON writer, manifest creator, or directory publisher.

- [ ] **Step 7: Run focused unit tests and commit**

Run: `npm.cmd test -- tests/source/daily-source.test.ts tests/markdown/parse-markdown.test.ts tests/storage/publish-pdf.test.ts tests/core/generate-report.test.ts`

Expected: PASS.

```powershell
git add src/core/generate-report.ts src/core/result.ts src/storage/publish-pdf.ts tests/core/generate-report.test.ts tests/storage/publish-pdf.test.ts
git commit -m "feat: generate and publish one PDF"
```

---

### Task 6: Simplify the CLI, prove end-to-end output, and document daily use

**Files:**
- Modify: `src/cli/arguments.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/console-reporter.ts`
- Modify: `tests/cli/arguments.test.ts`
- Modify: `tests/e2e/export-report.spec.ts`
- Modify: `README.md`

**Interfaces:**
- CLI keeps `<markdown-file>`, `--open`, `--dry-run`, and `--verbose`.
- CLI removes `--scale` and `--force` because PDF is vector and every successful run safely replaces its one target.
- Success output prints only `PDF` and the absolute `outputPath`.

- [ ] **Step 1: Write failing CLI option tests**

```ts
it("defaults to PDF-only options", () => {
  expect(parseCliArguments(["node", "cli", "daily/2026-08/2026-08-01.md"]))
    .toEqual({
      markdownFile: "daily/2026-08/2026-08-01.md",
      open: false,
      dryRun: false,
      verbose: false
    });
});

it.each(["--scale", "--force"])("rejects removed option %s", (option) => {
  expect(() => parseCliArguments(["node", "cli", "report.md", option]))
    .toThrow();
});
```

- [ ] **Step 2: Run CLI tests and verify RED**

Run: `npm.cmd test -- tests/cli/arguments.test.ts`

Expected: FAIL because the current CLI returns `scale` and `force` and accepts both flags.

- [ ] **Step 3: Remove raster/cache options and update reporting**

Update `CliOptions`, Commander declarations, `generateReport` call, and console output. Dry-run output should state that Markdown was parsed and show the future PDF path. Generated output should contain exactly one artifact line such as `✓ 30-31.pdf` followed by the absolute path. `--open` opens `outputDir` after generation.

```ts
export interface CliOptions {
  markdownFile: string;
  open: boolean;
  dryRun: boolean;
  verbose: boolean;
}

program
  .name("daily-report")
  .argument("<markdown-file>")
  .option("--open", "open output directory after success", false)
  .option("--dry-run", "parse and validate only", false)
  .option("--verbose", "show detailed logging", false)
  .exitOverride();
```

```ts
const result = await generateReport({
  sourcePath,
  projectRoot: process.cwd(),
  dryRun: options.dryRun,
  verbose: options.verbose
});
```

```ts
if (result.status === "dry-run") {
  console.log("✓ Markdown parsed");
  console.log(`PDF: ${result.outputPath}`);
} else {
  console.log(`✓ ${path.basename(result.outputPath)}`);
  console.log(result.outputPath);
}
```

- [ ] **Step 4: Run CLI tests and verify GREEN**

Run: `npm.cmd test -- tests/cli/arguments.test.ts`

Expected: PASS.

- [ ] **Step 5: Replace the end-to-end test with the accepted workflow**

```ts
test("generates only daily/<month>/images/<numeric-range>.pdf", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "pdr-e2e-"));
  const sourceDir = path.join(projectRoot, "daily", "2026-07");
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = path.join(sourceDir, "2026-07-30-31.md");
  await cp(path.resolve("tests/fixtures/plain-daily.md"), sourcePath);

  const result = await generateReport({
    sourcePath,
    projectRoot,
    dryRun: false,
    verbose: false
  });

  expect(result.status).toBe("generated");
  if (result.status !== "generated") throw new Error("expected generated");
  expect(result.outputPath).toBe(path.join(sourceDir, "images", "30-31.pdf"));
  expect(await readdir(path.join(sourceDir, "images"))).toEqual(["30-31.pdf"]);
  const pdf = await PDFDocument.load(await readFile(result.outputPath));
  expect(pdf.getPageCount()).toBe(1);
  await expect(access(path.join(projectRoot, "reports", "rendered"))).rejects.toThrow();
  await expect(access(path.join(projectRoot, ".daily-report-cache"))).rejects.toThrow();
});
```

- [ ] **Step 6: Run the end-to-end test and verify GREEN**

Run: `npx.cmd playwright test tests/e2e/export-report.spec.ts`

Expected: PASS and only one PDF exists in `images/`.

- [ ] **Step 7: Rewrite README around the real daily workflow**

Document installation once, single-day and range examples, exact numeric output mapping, vector clarity, supported Markdown, `--dry-run`, `--open`, test command, and the fact that source files remain in `daily/YYYY-MM/`. Remove all `reports/source`, `reports/rendered`, PNG, scale, JSON, manifest, and cache-facing instructions.

- [ ] **Step 8: Run full verification**

Run: `npm.cmd test`

Expected: all Vitest files PASS.

Run: `npx.cmd playwright test`

Expected: all Playwright tests PASS with no unexpected PNG production artifact.

Run: `npm.cmd run build`

Expected: TypeScript checking and Vite build exit 0.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 9: Perform a real-format dry run and isolated PDF inspection**

Run:

```powershell
npm.cmd run report -- "daily\2026-07\2026-07-30-31.md" --dry-run
```

Expected: Markdown parses successfully and reports `daily\2026-07\images\30-31.pdf` without writing it.

Generate from a copied real-format fixture in a temporary project root, then inspect with `pdf-lib`: exactly one page, non-empty bytes, and no sibling PNG/JSON/manifest. Do not create or commit a real PDF under the repository during validation.

- [ ] **Step 10: Commit the completed workflow**

```powershell
git add src/cli tests/cli tests/e2e/export-report.spec.ts README.md
git commit -m "docs: simplify daily PDF workflow"
```

---

### Task 7: Final review against the approved specification

**Files:**
- Review: `docs/superpowers/specs/2026-08-01-pdf-long-poster-output-design.md`
- Review: all files changed by Tasks 1–6

**Interfaces:**
- Consumes the complete implementation and test evidence.
- Produces no code unless a discovered defect first receives a failing regression test.

- [ ] **Step 1: Review scope and artifact behavior**

Confirm the production path never calls `page.screenshot`, never writes PNG/JSON/manifest, never writes under `reports/rendered`, and never modifies the source Markdown. Confirm output naming for days 1, 9, 30, and range 9–11.

- [ ] **Step 2: Review safety and edge cases**

Confirm month/day validation handles leap years, end-day ordering, folder/file year-month mismatch, path traversal, missing image files, unsafe links, empty Markdown, height overflow, pre-existing PDF replacement, and failure rollback.

- [ ] **Step 3: Re-run fresh final verification**

Run: `npm.cmd run test:all`

Expected: Vitest, Playwright, TypeScript, and Vite all exit 0 in one fresh run.

Run: `git status --short --branch`

Expected: only intentionally generated ignored test/build outputs; no uncommitted source or documentation changes.

- [ ] **Step 4: Record review fixes or finish**

If review finds a defect, add a focused failing regression test, verify it fails for the expected reason, implement the smallest fix, rerun the relevant focused and full checks, and commit with `fix: <specific behavior>`. If no defect is found, do not create an empty review commit.
