# Personal Daily Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-local CLI that converts one strictly formatted Markdown daily report into validated JSON, a 1080 px-wide long PNG, and a single-page long PDF.

**Architecture:** A strict line-oriented parser converts Markdown into a `DailyReport` domain model validated by Zod. A React/Vite render page receives that model from a loopback-only development server, while Playwright Chromium waits for fonts and stable layout before exporting artifacts. The orchestration layer uses a temporary run directory, cache manifest, and rollback-safe directory swap so failed runs never replace a valid report.

**Tech Stack:** Node.js 24 LTS, npm, TypeScript, React, Vite, Zod, YAML, Commander, Playwright Chromium, Vitest, Testing Library, and Playwright Test.

## Global Constraints

- Repository root: `H:\Workshop\PDR\personal-daily-reports`.
- Runtime platform for v0.1.0: Windows PowerShell.
- Node.js major version: 24 LTS.
- Package manager: npm with committed `package-lock.json`.
- Input format: one fixed Markdown schema; no AI-assisted interpretation.
- Production template count: exactly one.
- Render width: exactly `1080px` in CSS coordinates.
- Render height: content-driven; minimum `1920px`.
- Output formats: one long PNG and one single-page long PDF.
- Default PNG scale: `1`; optional scale: `2`.
- Normal height: `<= 10000px`; warning range: `10001–16000px`; reject above `16000px`.
- Server binding: `127.0.0.1` only.
- The daily runtime must not call Figma, Figma MCP, or Figma APIs.
- Figma remains a visual reference; React/CSS is the production rendering authority.
- v0.1.0 excludes Git push automation, GitHub Actions, multiple templates, pagination, a web editor, embedded project images, Markdown tables, and nested lists.
- Use test-driven development: failing test, minimal implementation, passing test, then commit.
- Do not commit font files unless their redistribution license has been verified.
- Every generated artifact must first be written to `.daily-report-cache`, validated, and only then published.
- A failed run must preserve the previous valid output directory.

---

## Locked File Map

The plan creates the following focused units.

```text
personal-daily-reports/
├── package.json                         # scripts, engines, dependencies
├── package-lock.json                    # reproducible dependency lock
├── tsconfig.json                        # shared TypeScript configuration
├── vite.config.ts                       # React renderer configuration
├── vitest.config.ts                     # unit/component test configuration
├── playwright.config.ts                 # E2E and visual comparison configuration
├── index.html                           # Vite render entry
├── .gitignore                           # cache and generated test output exclusions
│
├── src/
│   ├── app/
│   │   ├── main.tsx                     # fetch report data and mount renderer
│   │   └── render-readiness.ts          # fonts/images/browser readiness
│   ├── cli/
│   │   ├── index.ts                     # command-line entry point
│   │   ├── arguments.ts                 # Commander option parsing
│   │   └── console-reporter.ts          # deterministic terminal output
│   ├── core/
│   │   ├── constants.ts                 # generator/template versions and thresholds
│   │   ├── generate-report.ts           # end-to-end orchestration
│   │   └── result.ts                    # typed success/error result structures
│   ├── exporter/
│   │   ├── browser.ts                   # Chromium lifecycle
│   │   ├── layout-checks.ts             # width, overflow, clipping, height checks
│   │   └── export-artifacts.ts          # PNG/PDF export
│   ├── parser/
│   │   ├── parse-report.ts              # strict line-oriented Markdown parser
│   │   ├── parse-error.ts               # errors with file and line metadata
│   │   └── source-locations.ts          # source-line map for validation messages
│   ├── schema/
│   │   ├── report-schema.ts             # Zod schemas and normalization
│   │   └── report-types.ts              # exported domain types
│   ├── server/
│   │   └── start-render-server.ts       # loopback Vite server + JSON endpoint
│   ├── storage/
│   │   ├── cache.ts                     # hashes and up-to-date checks
│   │   ├── manifest.ts                  # manifest types and creation
│   │   ├── paths.ts                     # source/output/temp path resolution
│   │   └── publish.ts                   # rollback-safe directory replacement
│   └── template/
│       ├── DailyReportPage.tsx           # 1080px root template
│       ├── components/
│       │   ├── ContentSection.tsx
│       │   ├── GlobalNextActions.tsx
│       │   ├── ProjectCard.tsx
│       │   ├── ReportFooter.tsx
│       │   ├── ReportHeader.tsx
│       │   └── StatusBadge.tsx
│       └── styles/
│           ├── report.css
│           └── tokens.css
│
├── reports/
│   ├── source/2026/08/2026-08-01.md
│   └── rendered/                         # generated output; retained in Git later
│
├── template-reference/
│   ├── design-spec.md
│   └── figma-reference.png               # manually exported 1x reference frame
│
├── tests/
│   ├── components/
│   │   ├── DailyReportPage.test.tsx
│   │   ├── ProjectCard.test.tsx
│   │   └── StatusBadge.test.tsx
│   ├── e2e/
│   │   ├── export-report.spec.ts
│   │   └── visual-report.spec.ts
│   ├── fixtures/
│   │   ├── invalid-duplicate-code.md
│   │   ├── invalid-missing-next.md
│   │   ├── invalid-wrong-date.md
│   │   ├── valid-basic.md
│   │   ├── valid-empty-issues.md
│   │   ├── valid-long.md
│   │   └── visual-reference.md
│   ├── parser/
│   │   └── parse-report.test.ts
│   ├── schema/
│   │   └── report-schema.test.ts
│   └── setup.ts
│
└── docs/
    └── superpowers/
        ├── specs/2026-08-01-daily-report-generator-design.md
        └── plans/2026-08-01-daily-report-generator-implementation.md
```

---

### Task 1: Bootstrap the TypeScript, React, and Test Runtime

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `.gitignore`
- Create: `src/core/constants.ts`
- Create: `src/template/DailyReportPage.tsx`
- Test: `tests/components/DailyReportPage.test.tsx`

**Interfaces:**
- Produces: `GENERATOR_VERSION`, `TEMPLATE_NAME`, `TEMPLATE_VERSION`, `REPORT_WIDTH`, `MIN_REPORT_HEIGHT`, `WARN_REPORT_HEIGHT`, `MAX_REPORT_HEIGHT`.
- Produces: `DailyReportPage` placeholder component that later tasks replace without changing its exported name.

- [ ] **Step 1: Verify the repository and copy the approved specification into place**

Run in PowerShell:

```powershell
Set-Location 'H:\Workshop\PDR\personal-daily-reports'
git status
New-Item -ItemType Directory -Force 'docs\superpowers\specs' | Out-Null
New-Item -ItemType Directory -Force 'docs\superpowers\plans' | Out-Null
```

Copy the approved design file into:

```text
docs/superpowers/specs/2026-08-01-daily-report-generator-design.md
```

Save this implementation plan into:

```text
docs/superpowers/plans/2026-08-01-daily-report-generator-implementation.md
```

Expected: `git status --short` shows the two documentation files and no unrelated deletion.

- [ ] **Step 2: Create the failing renderer smoke test**

Create `tests/components/DailyReportPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyReportPage } from "../../src/template/DailyReportPage";

describe("DailyReportPage", () => {
  it("exposes the fixed report root", () => {
    render(<DailyReportPage />);
    const root = screen.getByTestId("daily-report");
    expect(root).toHaveAttribute("id", "daily-report");
  });
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Initialize npm and install dependencies**

Run:

```powershell
npm init -y
npm install react react-dom zod yaml commander vite get-port open
npm install -D typescript tsx @types/node @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test playwright pngjs @types/pngjs pdf-lib
npx playwright install chromium
```

Expected: `package-lock.json` exists and Chromium installation completes.

- [ ] **Step 4: Configure package scripts and TypeScript**

Replace `package.json` with:

```json
{
  "name": "personal-daily-reports",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24 <25"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "report": "tsx src/cli/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test tests/e2e",
    "test:all": "npm run test && npm run test:e2e && npm run build"
  },
  "dependencies": {
    "commander": "^14.0.0",
    "get-port": "^7.1.0",
    "open": "^11.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^8.0.0",
    "yaml": "^2.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^24.0.0",
    "@types/pngjs": "^6.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "pdf-lib": "^1.17.1",
    "playwright": "^1.50.0",
    "pngjs": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.8.0",
    "vitest": "^4.0.0"
  }
}
```

Then run `npm install` once more so the lock file matches the declared ranges.

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "tests", "*.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1"
  }
});
```

Install the missing Vite React plugin:

```powershell
npm install -D @vitejs/plugin-react
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
.daily-report-cache/
tests/visual/current/
tests/visual/diffs/
playwright-report/
test-results/
*.log
```

- [ ] **Step 5: Run the smoke test and verify it fails**

Run:

```powershell
npm test -- tests/components/DailyReportPage.test.tsx
```

Expected: FAIL because `src/template/DailyReportPage.tsx` does not exist.

- [ ] **Step 6: Add the minimal component and constants**

Create `src/core/constants.ts`:

```ts
export const GENERATOR_VERSION = "0.1.0";
export const TEMPLATE_NAME = "personal-daily-report";
export const TEMPLATE_VERSION = "1.0.0";

export const REPORT_WIDTH = 1080;
export const MIN_REPORT_HEIGHT = 1920;
export const WARN_REPORT_HEIGHT = 10_000;
export const MAX_REPORT_HEIGHT = 16_000;
```

Create `src/template/DailyReportPage.tsx`:

```tsx
export function DailyReportPage(): React.JSX.Element {
  return (
    <main id="daily-report" data-testid="daily-report">
      Daily Report Renderer
    </main>
  );
}
```

- [ ] **Step 7: Run tests and type checking**

Run:

```powershell
npm test -- tests/components/DailyReportPage.test.tsx
npx tsc --noEmit
```

Expected: both commands PASS.

- [ ] **Step 8: Commit the bootstrap**

```powershell
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts .gitignore tests/setup.ts tests/components/DailyReportPage.test.tsx src/core/constants.ts src/template/DailyReportPage.tsx docs/superpowers
git commit -m "chore: bootstrap daily report generator"
```

---

### Task 2: Define and Validate the DailyReport Domain Model

**Files:**
- Create: `src/schema/report-types.ts`
- Create: `src/schema/report-schema.ts`
- Test: `tests/schema/report-schema.test.ts`

**Interfaces:**
- Produces: `ProjectStatus`, `ReportMeta`, `ReportProject`, `DailyReport`.
- Produces: `dailyReportSchema` and `validateDailyReport(input: unknown): DailyReport`.
- Normalizes one-item issue arrays containing `暂无`, `暂无。`, `无`, or `无。` to `[]`.

- [ ] **Step 1: Write failing schema tests**

Create `tests/schema/report-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateDailyReport } from "../../src/schema/report-schema";

const validReport = {
  meta: {
    title: "个人日报",
    date: "2026-08-01",
    owner: "Wenzel",
    version: "V1",
    subtitle: "RESEARCH & ENGINEERING OPERATIONS LOG"
  },
  projects: [
    {
      code: "PRJ-HC",
      title: "HC 耦合酸蚀程序",
      status: "in-progress",
      summary: "完成网格稀疏化。",
      progress: ["完成网格生成。"],
      issues: ["暂无。"],
      next: ["运行完整程序。"]
    }
  ],
  globalNextActions: ["完成日报生成器。"]
};

describe("validateDailyReport", () => {
  it("accepts a valid report and normalizes empty issues", () => {
    const report = validateDailyReport(validReport);
    expect(report.projects[0].issues).toEqual([]);
  });

  it("rejects an unknown status", () => {
    const input = structuredClone(validReport);
    input.projects[0].status = "working";
    expect(() => validateDailyReport(input)).toThrow(/status/i);
  });

  it("rejects duplicate project codes", () => {
    const input = structuredClone(validReport);
    input.projects.push({ ...input.projects[0] });
    expect(() => validateDailyReport(input)).toThrow(/duplicate project code/i);
  });

  it("rejects an invalid date", () => {
    const input = structuredClone(validReport);
    input.meta.date = "2026/08/01";
    expect(() => validateDailyReport(input)).toThrow(/YYYY-MM-DD/);
  });

  it("rejects an empty next-action list", () => {
    const input = structuredClone(validReport);
    input.projects[0].next = [];
    expect(() => validateDailyReport(input)).toThrow(/next/i);
  });
});
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```powershell
npm test -- tests/schema/report-schema.test.ts
```

Expected: FAIL because `report-schema.ts` does not exist.

- [ ] **Step 3: Add domain types**

Create `src/schema/report-types.ts`:

```ts
export type ProjectStatus =
  | "completed"
  | "in-progress"
  | "planned"
  | "blocked";

export interface ReportMeta {
  title: string;
  date: string;
  owner: string;
  version?: string;
  subtitle?: string;
}

export interface ReportProject {
  code: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  progress: string[];
  issues: string[];
  next: string[];
}

export interface DailyReport {
  meta: ReportMeta;
  projects: ReportProject[];
  globalNextActions: string[];
}
```

- [ ] **Step 4: Implement the Zod schema and duplicate-code refinement**

Create `src/schema/report-schema.ts`:

```ts
import { z } from "zod";
import type { DailyReport } from "./report-types";

const emptyIssueValues = new Set(["暂无", "暂无。", "无", "无。"]);

const nonEmptyText = z.string().trim().min(1);

const reportMetaSchema = z.object({
  title: nonEmptyText,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD"),
  owner: nonEmptyText,
  version: nonEmptyText.optional(),
  subtitle: nonEmptyText.optional()
});

const projectSchema = z.object({
  code: z
    .string()
    .regex(/^[A-Z0-9-]+$/, "code must match ^[A-Z0-9-]+$"),
  title: nonEmptyText,
  status: z.enum(["completed", "in-progress", "planned", "blocked"]),
  summary: nonEmptyText,
  progress: z.array(nonEmptyText).min(1),
  issues: z.array(nonEmptyText).transform((items) => {
    if (items.length === 1 && emptyIssueValues.has(items[0])) {
      return [];
    }
    return items;
  }),
  next: z.array(nonEmptyText).min(1)
});

export const dailyReportSchema = z
  .object({
    meta: reportMetaSchema,
    projects: z.array(projectSchema).min(1),
    globalNextActions: z.array(nonEmptyText).min(1)
  })
  .superRefine((report, context) => {
    const seen = new Set<string>();

    report.projects.forEach((project, index) => {
      if (seen.has(project.code)) {
        context.addIssue({
          code: "custom",
          path: ["projects", index, "code"],
          message: `duplicate project code: ${project.code}`
        });
      }
      seen.add(project.code);
    });
  });

export function validateDailyReport(input: unknown): DailyReport {
  return dailyReportSchema.parse(input) as DailyReport;
}
```

- [ ] **Step 5: Run schema tests**

Run:

```powershell
npm test -- tests/schema/report-schema.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit the domain model**

```powershell
git add src/schema tests/schema
git commit -m "feat: define daily report schema"
```

---

### Task 3: Parse the Fixed Markdown Format with Exact Line Errors

**Files:**
- Create: `src/parser/parse-error.ts`
- Create: `src/parser/source-locations.ts`
- Create: `src/parser/parse-report.ts`
- Create: `tests/fixtures/valid-basic.md`
- Create: `tests/fixtures/valid-empty-issues.md`
- Create: `tests/fixtures/invalid-missing-next.md`
- Create: `tests/fixtures/invalid-duplicate-code.md`
- Create: `tests/fixtures/invalid-wrong-date.md`
- Test: `tests/parser/parse-report.test.ts`

**Interfaces:**
- Produces: `ParseReportError` with `filePath`, `line`, and `message`.
- Produces: `parseReportMarkdown(source: string, filePath: string): DailyReport`.
- Consumes: `validateDailyReport(input)` from Task 2.
- Accepts only blank lines, recognized headings, `code:`, `status:`, blockquote summary lines, and top-level `- ` list items.

- [ ] **Step 1: Add the canonical valid fixture**

Create `tests/fixtures/valid-basic.md`:

```md
---
title: 科研工程风个人日报
date: 2026-08-01
owner: Wenzel
version: V1
subtitle: RESEARCH & ENGINEERING OPERATIONS LOG
---

## HC 耦合酸蚀程序

code: PRJ-HC
status: in-progress

> Step 3 网格稀疏化已经完成。

### 今日进展

- 完成近场密、远场稀的非均匀三角网格。
- 检查输入文件和边界条件。

### 当前问题

- 后处理程序尚未完整跑通。

### 下一步

- 跑通完整计算流程。

## 全局下一步计划

- 整理个人日报自动化程序。
```

Create `tests/fixtures/valid-empty-issues.md` by using the same file and replacing the current issue item with:

```md
- 暂无。
```

Create `tests/fixtures/invalid-missing-next.md` from `valid-basic.md` but remove the `### 下一步` heading and its item.

Create `tests/fixtures/invalid-duplicate-code.md` by duplicating the project block with the same `code: PRJ-HC`.

Create `tests/fixtures/invalid-wrong-date.md` with Front Matter date `2026-08-02`.

- [ ] **Step 2: Write failing parser tests**

Create `tests/parser/parse-report.test.ts`:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseReportFile,
  parseReportMarkdown
} from "../../src/parser/parse-report";
import { ParseReportError } from "../../src/parser/parse-error";

const fixture = (name: string) =>
  path.resolve("tests", "fixtures", name);

describe("parseReportMarkdown", () => {
  it("parses the fixed report structure", async () => {
    const filePath = fixture("valid-basic.md");
    const source = await readFile(filePath, "utf8");
    const report = parseReportMarkdown(source, filePath);

    expect(report.meta.date).toBe("2026-08-01");
    expect(report.projects).toHaveLength(1);
    expect(report.projects[0]).toMatchObject({
      code: "PRJ-HC",
      status: "in-progress",
      progress: [
        "完成近场密、远场稀的非均匀三角网格。",
        "检查输入文件和边界条件。"
      ]
    });
  });

  it("normalizes 暂无 to an empty issue list", async () => {
    const report = await parseReportFile(
      fixture("valid-empty-issues.md")
    );
    expect(report.projects[0].issues).toEqual([]);
  });

  it("reports the project heading line when 下一步 is missing", async () => {
    await expect(
      parseReportFile(fixture("invalid-missing-next.md"))
    ).rejects.toMatchObject({
      name: "ParseReportError",
      line: 9
    });
  });

  it("rejects duplicate codes", async () => {
    await expect(
      parseReportFile(fixture("invalid-duplicate-code.md"))
    ).rejects.toThrow(/duplicate project code/i);
  });

  it("rejects a file-name and Front Matter date mismatch", async () => {
    await expect(
      parseReportFile(fixture("invalid-wrong-date.md"))
    ).rejects.toThrow(/file name date/i);
  });

  it("rejects unsupported free text", () => {
    expect(() =>
      parseReportMarkdown(
        [
          "---",
          "title: 个人日报",
          "date: 2026-08-01",
          "owner: Wenzel",
          "---",
          "",
          "unsupported"
        ].join("\n"),
        "2026-08-01.md"
      )
    ).toThrow(ParseReportError);
  });
});
```

- [ ] **Step 3: Run parser tests and verify failure**

Run:

```powershell
npm test -- tests/parser/parse-report.test.ts
```

Expected: FAIL because parser modules do not exist.

- [ ] **Step 4: Define source-aware errors**

Create `src/parser/parse-error.ts`:

```ts
export class ParseReportError extends Error {
  readonly filePath: string;
  readonly line: number;

  constructor(message: string, filePath: string, line: number) {
    super(message);
    this.name = "ParseReportError";
    this.filePath = filePath;
    this.line = line;
  }
}
```

Create `src/parser/source-locations.ts`:

```ts
export interface ProjectSourceLocation {
  headingLine: number;
  codeLine?: number;
  statusLine?: number;
  summaryLine?: number;
  sectionLines: Partial<
    Record<"今日进展" | "当前问题" | "下一步", number>
  >;
}

export interface ReportSourceLocations {
  frontMatterStartLine: number;
  projects: ProjectSourceLocation[];
  globalNextHeadingLine?: number;
}
```

- [ ] **Step 5: Implement the strict line parser**

Create `src/parser/parse-report.ts` with these exported functions:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { ZodError } from "zod";
import { validateDailyReport } from "../schema/report-schema";
import type {
  DailyReport,
  ProjectStatus,
  ReportProject
} from "../schema/report-types";
import { ParseReportError } from "./parse-error";
import type {
  ProjectSourceLocation,
  ReportSourceLocations
} from "./source-locations";

type SectionName = "今日进展" | "当前问题" | "下一步";

interface MutableProject {
  title: string;
  code?: string;
  status?: ProjectStatus;
  summaryLines: string[];
  progress: string[];
  issues: string[];
  next: string[];
}

const sectionTarget: Record<
  SectionName,
  keyof Pick<MutableProject, "progress" | "issues" | "next">
> = {
  今日进展: "progress",
  当前问题: "issues",
  下一步: "next"
};

function fail(
  message: string,
  filePath: string,
  line: number
): never {
  throw new ParseReportError(message, filePath, line);
}

function parseFrontMatter(
  lines: string[],
  filePath: string
): { meta: unknown; bodyStartIndex: number } {
  if (lines[0]?.trim() !== "---") {
    fail("Front Matter must start on line 1", filePath, 1);
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );

  if (closingIndex < 0) {
    fail("Front Matter closing delimiter is missing", filePath, 1);
  }

  const yamlText = lines.slice(1, closingIndex).join("\n");

  try {
    return {
      meta: YAML.parse(yamlText),
      bodyStartIndex: closingIndex + 1
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid YAML";
    fail(`Invalid Front Matter: ${message}`, filePath, 2);
  }
}

function finalizeProject(
  project: MutableProject,
  location: ProjectSourceLocation,
  filePath: string
): ReportProject {
  if (!project.code) {
    fail(
      `Project "${project.title}" is missing code`,
      filePath,
      location.headingLine
    );
  }
  if (!project.status) {
    fail(
      `Project "${project.title}" is missing status`,
      filePath,
      location.headingLine
    );
  }
  if (project.summaryLines.length === 0) {
    fail(
      `Project ${project.code} is missing a summary blockquote`,
      filePath,
      location.headingLine
    );
  }

  for (const section of ["今日进展", "当前问题", "下一步"] as const) {
    if (!location.sectionLines[section]) {
      fail(
        `Project ${project.code} is missing "### ${section}"`,
        filePath,
        location.headingLine
      );
    }
  }

  return {
    code: project.code,
    title: project.title,
    status: project.status,
    summary: project.summaryLines.join(" ").trim(),
    progress: project.progress,
    issues: project.issues,
    next: project.next
  };
}

export function parseReportMarkdown(
  source: string,
  filePath: string
): DailyReport {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, bodyStartIndex } = parseFrontMatter(lines, filePath);
  const locations: ReportSourceLocations = {
    frontMatterStartLine: 1,
    projects: []
  };

  const projects: ReportProject[] = [];
  const globalNextActions: string[] = [];

  let currentProject: MutableProject | undefined;
  let currentLocation: ProjectSourceLocation | undefined;
  let currentSection: SectionName | undefined;
  let inGlobalNext = false;

  const closeCurrentProject = () => {
    if (currentProject && currentLocation) {
      projects.push(
        finalizeProject(currentProject, currentLocation, filePath)
      );
      locations.projects.push(currentLocation);
    }
    currentProject = undefined;
    currentLocation = undefined;
    currentSection = undefined;
  };

  for (let index = bodyStartIndex; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (line === "") continue;

    if (line.startsWith("## ")) {
      closeCurrentProject();
      const title = line.slice(3).trim();

      if (title === "全局下一步计划") {
        inGlobalNext = true;
        locations.globalNextHeadingLine = lineNumber;
        continue;
      }

      if (inGlobalNext) {
        fail(
          "Projects cannot appear after 全局下一步计划",
          filePath,
          lineNumber
        );
      }

      currentProject = {
        title,
        summaryLines: [],
        progress: [],
        issues: [],
        next: []
      };
      currentLocation = {
        headingLine: lineNumber,
        sectionLines: {}
      };
      continue;
    }

    if (inGlobalNext) {
      if (!line.startsWith("- ")) {
        fail(
          "全局下一步计划 only accepts top-level '- ' list items",
          filePath,
          lineNumber
        );
      }
      globalNextActions.push(line.slice(2).trim());
      continue;
    }

    if (!currentProject || !currentLocation) {
      fail(
        "Content must be inside a project or 全局下一步计划",
        filePath,
        lineNumber
      );
    }

    if (line.startsWith("code:")) {
      currentProject.code = line.slice("code:".length).trim();
      currentLocation.codeLine = lineNumber;
      continue;
    }

    if (line.startsWith("status:")) {
      currentProject.status = line
        .slice("status:".length)
        .trim() as ProjectStatus;
      currentLocation.statusLine = lineNumber;
      continue;
    }

    if (line.startsWith(">")) {
      currentProject.summaryLines.push(
        line.replace(/^>\s?/, "").trim()
      );
      currentLocation.summaryLine ??= lineNumber;
      continue;
    }

    if (line.startsWith("### ")) {
      const section = line.slice(4).trim();
      if (!(section in sectionTarget)) {
        fail(
          `Unsupported project section: ${section}`,
          filePath,
          lineNumber
        );
      }
      currentSection = section as SectionName;
      currentLocation.sectionLines[currentSection] = lineNumber;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!currentSection) {
        fail(
          "Project list item appears before a recognized section",
          filePath,
          lineNumber
        );
      }
      const value = line.slice(2).trim();
      currentProject[sectionTarget[currentSection]].push(value);
      continue;
    }

    fail(`Unsupported Markdown syntax: ${line}`, filePath, lineNumber);
  }

  closeCurrentProject();

  if (!locations.globalNextHeadingLine) {
    fail(
      'Missing "## 全局下一步计划"',
      filePath,
      lines.length
    );
  }

  const candidate = {
    meta,
    projects,
    globalNextActions
  };

  try {
    return validateDailyReport(candidate);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      const projectIndex =
        issue.path[0] === "projects" &&
        typeof issue.path[1] === "number"
          ? issue.path[1]
          : undefined;
      const line =
        projectIndex === undefined
          ? 1
          : locations.projects[projectIndex]?.headingLine ?? 1;
      fail(issue.message, filePath, line);
    }
    throw error;
  }
}

export async function parseReportFile(
  filePath: string
): Promise<DailyReport> {
  const source = await readFile(filePath, "utf8");
  const report = parseReportMarkdown(source, filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  if (baseName !== report.meta.date) {
    throw new ParseReportError(
      `file name date "${baseName}" does not match Front Matter date "${report.meta.date}"`,
      filePath,
      1
    );
  }

  return report;
}
```

- [ ] **Step 6: Run parser and schema tests**

Run:

```powershell
npm test -- tests/parser/parse-report.test.ts tests/schema/report-schema.test.ts
npx tsc --noEmit
```

Expected: PASS. If the exact heading line in the fixture differs from `9`, update the fixture or expected line so the assertion matches the real `##` line; do not weaken the test to “greater than zero.”

- [ ] **Step 7: Commit the parser**

```powershell
git add src/parser tests/fixtures tests/parser
git commit -m "feat: parse fixed daily report markdown"
```

---

### Task 4: Resolve Paths, Hash Inputs, Build Manifests, and Publish Atomically

**Files:**
- Create: `src/storage/paths.ts`
- Create: `src/storage/cache.ts`
- Create: `src/storage/manifest.ts`
- Create: `src/storage/publish.ts`
- Test: `tests/storage/storage.test.ts`

**Interfaces:**
- Produces: `resolveReportPaths(sourcePath, reportDate, projectRoot, runId): ReportPaths`.
- Produces: `sha256File(filePath): Promise<string>`.
- Produces: `isOutputCurrent(paths, fingerprint): Promise<boolean>`.
- Produces: `createManifest(input): ReportManifest`.
- Produces: `publishRunDirectory(tempOutputDir, finalOutputDir): Promise<void>`.

- [ ] **Step 1: Write failing storage tests**

Create `tests/storage/storage.test.ts`:

```ts
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256File } from "../../src/storage/cache";
import { resolveReportPaths } from "../../src/storage/paths";
import { publishRunDirectory } from "../../src/storage/publish";

describe("storage utilities", () => {
  it("resolves the dated output directory", () => {
    const root = "H:\\Workshop\\PDR\\personal-daily-reports";
    const paths = resolveReportPaths(
      path.join(root, "reports", "source", "2026", "08", "2026-08-01.md"),
      "2026-08-01",
      root,
      "run-1"
    );

    expect(paths.finalOutputDir).toBe(
      path.join(root, "reports", "rendered", "2026", "08", "2026-08-01")
    );
  });

  it("hashes identical content identically", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "pdr-hash-"));
    const first = path.join(root, "a.md");
    const second = path.join(root, "b.md");
    await writeFile(first, "same", "utf8");
    await writeFile(second, "same", "utf8");

    expect(await sha256File(first)).toBe(await sha256File(second));
  });

  it("replaces a final directory and removes the old content", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "pdr-publish-"));
    const temp = path.join(root, "temp");
    const final = path.join(root, "final");
    await mkdir(temp);
    await mkdir(final);
    await writeFile(path.join(temp, "report.png"), "new");
    await writeFile(path.join(final, "report.png"), "old");

    await publishRunDirectory(temp, final);

    expect(await readFile(path.join(final, "report.png"), "utf8")).toBe("new");
  });
});
```

- [ ] **Step 2: Run storage tests and verify failure**

Run:

```powershell
npm test -- tests/storage/storage.test.ts
```

Expected: FAIL because storage modules do not exist.

- [ ] **Step 3: Implement path resolution**

Create `src/storage/paths.ts`:

```ts
import path from "node:path";

export interface ReportPaths {
  projectRoot: string;
  sourcePath: string;
  cacheRoot: string;
  runRoot: string;
  tempOutputDir: string;
  finalOutputDir: string;
  tempPngPath: string;
  tempPdfPath: string;
  tempJsonPath: string;
  tempManifestPath: string;
}

export function resolveReportPaths(
  sourcePath: string,
  reportDate: string,
  projectRoot: string,
  runId: string
): ReportPaths {
  const [year, month] = reportDate.split("-");
  const cacheRoot = path.join(projectRoot, ".daily-report-cache");
  const runRoot = path.join(cacheRoot, runId);
  const tempOutputDir = path.join(runRoot, "output");
  const finalOutputDir = path.join(
    projectRoot,
    "reports",
    "rendered",
    year,
    month,
    reportDate
  );

  return {
    projectRoot,
    sourcePath,
    cacheRoot,
    runRoot,
    tempOutputDir,
    finalOutputDir,
    tempPngPath: path.join(tempOutputDir, "report.png"),
    tempPdfPath: path.join(tempOutputDir, "report.pdf"),
    tempJsonPath: path.join(tempOutputDir, "report.json"),
    tempManifestPath: path.join(tempOutputDir, "manifest.json")
  };
}
```

- [ ] **Step 4: Implement hashing and cache checks**

Create `src/storage/cache.ts`:

```ts
import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ReportManifest } from "./manifest";

export interface OutputFingerprint {
  sourceHash: string;
  templateVersion: string;
  generatorVersion: string;
  scale: 1 | 2;
}

export async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function isNonEmpty(filePath: string): Promise<boolean> {
  try {
    const value = await stat(filePath);
    return value.isFile() && value.size > 0;
  } catch {
    return false;
  }
}

export async function isOutputCurrent(
  finalOutputDir: string,
  fingerprint: OutputFingerprint
): Promise<boolean> {
  const manifestPath = path.join(finalOutputDir, "manifest.json");

  try {
    await access(manifestPath);
    const manifest = JSON.parse(
      await readFile(manifestPath, "utf8")
    ) as ReportManifest;

    const matches =
      manifest.sourceHash === fingerprint.sourceHash &&
      manifest.template.version === fingerprint.templateVersion &&
      manifest.generatorVersion === fingerprint.generatorVersion &&
      manifest.render.scale === fingerprint.scale;

    if (!matches) return false;

    return await Promise.all([
      isNonEmpty(path.join(finalOutputDir, "report.png")),
      isNonEmpty(path.join(finalOutputDir, "report.pdf")),
      isNonEmpty(path.join(finalOutputDir, "report.json"))
    ]).then((values) => values.every(Boolean));
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Implement the manifest type and factory**

Create `src/storage/manifest.ts`:

```ts
export interface ReportManifest {
  source: string;
  sourceHash: string;
  reportDate: string;
  template: {
    name: string;
    version: string;
  };
  generatorVersion: string;
  generatedAt: string;
  render: {
    cssWidth: number;
    cssHeight: number;
    scale: 1 | 2;
    pngWidth: number;
    pngHeight: number;
  };
  outputs: {
    png: "report.png";
    pdf: "report.pdf";
    json: "report.json";
  };
}

export function createManifest(
  input: Omit<ReportManifest, "outputs">
): ReportManifest {
  return {
    ...input,
    outputs: {
      png: "report.png",
      pdf: "report.pdf",
      json: "report.json"
    }
  };
}
```

- [ ] **Step 6: Implement rollback-safe publication**

Create `src/storage/publish.ts`:

```ts
import {
  mkdir,
  rename,
  rm,
  stat
} from "node:fs/promises";
import path from "node:path";

async function exists(value: string): Promise<boolean> {
  try {
    await stat(value);
    return true;
  } catch {
    return false;
  }
}

export async function publishRunDirectory(
  tempOutputDir: string,
  finalOutputDir: string
): Promise<void> {
  const parent = path.dirname(finalOutputDir);
  const backup = `${finalOutputDir}.backup`;

  await mkdir(parent, { recursive: true });
  await rm(backup, { recursive: true, force: true });

  const hadExisting = await exists(finalOutputDir);

  try {
    if (hadExisting) {
      await rename(finalOutputDir, backup);
    }

    await rename(tempOutputDir, finalOutputDir);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await exists(finalOutputDir)) {
      await rm(finalOutputDir, { recursive: true, force: true });
    }
    if (hadExisting && (await exists(backup))) {
      await rename(backup, finalOutputDir);
    }
    throw error;
  }
}
```

- [ ] **Step 7: Run storage tests**

Run:

```powershell
npm test -- tests/storage/storage.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Commit storage behavior**

```powershell
git add src/storage tests/storage
git commit -m "feat: add report storage and atomic publishing"
```

---

### Task 5: Implement the React Daily Report Template and CSS Tokens

**Files:**
- Replace: `src/template/DailyReportPage.tsx`
- Create: `src/template/components/ReportHeader.tsx`
- Create: `src/template/components/StatusBadge.tsx`
- Create: `src/template/components/ContentSection.tsx`
- Create: `src/template/components/ProjectCard.tsx`
- Create: `src/template/components/GlobalNextActions.tsx`
- Create: `src/template/components/ReportFooter.tsx`
- Create: `src/template/styles/tokens.css`
- Create: `src/template/styles/report.css`
- Test: `tests/components/StatusBadge.test.tsx`
- Test: `tests/components/ProjectCard.test.tsx`
- Replace: `tests/components/DailyReportPage.test.tsx`

**Interfaces:**
- Consumes: `DailyReport`, `ReportProject`, and `ProjectStatus`.
- Produces: `<DailyReportPage report={report} />`.
- Guarantees: root `#daily-report`, 1080px width, minimum 1920px height, automatic card height, and no fixed-height text containers.

- [ ] **Step 1: Write failing component tests**

Create `tests/components/StatusBadge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../../src/template/components/StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["completed", "COMPLETED", "status--completed"],
    ["in-progress", "IN PROGRESS", "status--in-progress"],
    ["planned", "PLANNED", "status--planned"],
    ["blocked", "BLOCKED", "status--blocked"]
  ] as const)("maps %s to its label and class", (status, label, cssClass) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveClass(cssClass);
  });
});
```

Create `tests/components/ProjectCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReportProject } from "../../src/schema/report-types";
import { ProjectCard } from "../../src/template/components/ProjectCard";

const project: ReportProject = {
  code: "PRJ-HC",
  title: "HC 耦合酸蚀程序",
  status: "in-progress",
  summary: "项目摘要。",
  progress: ["完成网格。"],
  issues: [],
  next: ["运行程序。"]
};

describe("ProjectCard", () => {
  it("renders all fixed sections and the empty issue text", () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByText("PRJ-HC")).toBeInTheDocument();
    expect(screen.getByText("HC 耦合酸蚀程序")).toBeInTheDocument();
    expect(screen.getByText("今日进展")).toBeInTheDocument();
    expect(screen.getByText("当前问题")).toBeInTheDocument();
    expect(screen.getByText("下一步")).toBeInTheDocument();
    expect(screen.getByText("暂无待解决问题")).toBeInTheDocument();
  });
});
```

Replace `tests/components/DailyReportPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DailyReport } from "../../src/schema/report-types";
import { DailyReportPage } from "../../src/template/DailyReportPage";

const report: DailyReport = {
  meta: {
    title: "科研工程风个人日报",
    date: "2026-08-01",
    owner: "Wenzel",
    version: "V1"
  },
  projects: [
    {
      code: "PRJ-002",
      title: "第二项目",
      status: "planned",
      summary: "第二项目摘要。",
      progress: ["第二项目进展。"],
      issues: [],
      next: ["第二项目下一步。"]
    },
    {
      code: "PRJ-001",
      title: "第一项目",
      status: "completed",
      summary: "第一项目摘要。",
      progress: ["第一项目进展。"],
      issues: [],
      next: ["第一项目下一步。"]
    }
  ],
  globalNextActions: ["完成日报生成器。"]
};

describe("DailyReportPage", () => {
  it("keeps project order and exposes the report root", () => {
    render(<DailyReportPage report={report} />);

    const root = screen.getByTestId("daily-report");
    expect(root).toHaveAttribute("id", "daily-report");

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings.slice(0, 2)).toEqual(["第二项目", "第一项目"]);
  });
});
```

- [ ] **Step 2: Run component tests and verify failure**

Run:

```powershell
npm test -- tests/components
```

Expected: FAIL because the new components and prop signature do not exist.

- [ ] **Step 3: Implement status and content primitives**

Create `src/template/components/StatusBadge.tsx`:

```tsx
import type { ProjectStatus } from "../../schema/report-types";

const config: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "COMPLETED",
    className: "status--completed"
  },
  "in-progress": {
    label: "IN PROGRESS",
    className: "status--in-progress"
  },
  planned: {
    label: "PLANNED",
    className: "status--planned"
  },
  blocked: {
    label: "BLOCKED",
    className: "status--blocked"
  }
};

export function StatusBadge({
  status
}: {
  status: ProjectStatus;
}): React.JSX.Element {
  const value = config[status];

  return (
    <span className={`status-badge ${value.className}`}>
      {value.label}
    </span>
  );
}
```

Create `src/template/components/ContentSection.tsx`:

```tsx
interface ContentSectionProps {
  title: string;
  items: string[];
  emptyText?: string;
}

export function ContentSection({
  title,
  items,
  emptyText
}: ContentSectionProps): React.JSX.Element {
  const visibleItems =
    items.length > 0 ? items : emptyText ? [emptyText] : [];

  return (
    <section className="content-section">
      <h3>{title}</h3>
      <ul>
        {visibleItems.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Implement report components**

Create `src/template/components/ProjectCard.tsx`:

```tsx
import type { ReportProject } from "../../schema/report-types";
import { ContentSection } from "./ContentSection";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({
  project
}: {
  project: ReportProject;
}): React.JSX.Element {
  return (
    <article className="project-card" data-project-code={project.code}>
      <div className="project-card__header">
        <div className="project-card__identity">
          <span className="project-code">{project.code}</span>
          <h2>{project.title}</h2>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="project-summary">{project.summary}</p>

      <div className="project-sections">
        <ContentSection title="今日进展" items={project.progress} />
        <ContentSection
          title="当前问题"
          items={project.issues}
          emptyText="暂无待解决问题"
        />
        <ContentSection title="下一步" items={project.next} />
      </div>
    </article>
  );
}
```

Create `src/template/components/ReportHeader.tsx`:

```tsx
import type { ReportMeta } from "../../schema/report-types";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    timeZone: "Asia/Shanghai"
  }).format(new Date(`${date}T00:00:00+08:00`));
}

export function ReportHeader({
  meta
}: {
  meta: ReportMeta;
}): React.JSX.Element {
  return (
    <header className="report-header">
      <div className="report-header__meta">
        <span>OWNER / {meta.owner}</span>
        <time dateTime={meta.date}>{formatDate(meta.date)}</time>
      </div>
      <h1>{meta.title}</h1>
      <p>
        {meta.subtitle ??
          "RESEARCH & ENGINEERING OPERATIONS LOG"}
      </p>
      <svg
        className="header-decoration"
        viewBox="0 0 900 72"
        aria-hidden="true"
      >
        <path d="M0 56 L160 56 L210 18 L420 18 L470 56 L900 56" />
        <circle cx="210" cy="18" r="5" />
        <circle cx="470" cy="56" r="5" />
      </svg>
    </header>
  );
}
```

Create `src/template/components/GlobalNextActions.tsx`:

```tsx
export function GlobalNextActions({
  actions
}: {
  actions: string[];
}): React.JSX.Element {
  return (
    <section className="global-actions">
      <span className="section-eyebrow">GLOBAL ACTIONS</span>
      <h2>下一步计划</h2>
      <ul>
        {actions.map((action, index) => (
          <li key={`global-${index}`}>{action}</li>
        ))}
      </ul>
    </section>
  );
}
```

Create `src/template/components/ReportFooter.tsx`:

```tsx
import type { ReportMeta } from "../../schema/report-types";

export function ReportFooter({
  meta
}: {
  meta: ReportMeta;
}): React.JSX.Element {
  return (
    <footer className="report-footer">
      <div>
        <strong>PERSONAL DAILY REPORT</strong>
        <p>Research progress, engineering work and next actions.</p>
      </div>
      <div className="report-footer__meta">
        <time dateTime={meta.date}>{meta.date}</time>
        <span>{meta.version ?? "V1"}</span>
      </div>
    </footer>
  );
}
```

Replace `src/template/DailyReportPage.tsx`:

```tsx
import type { DailyReport } from "../schema/report-types";
import { GlobalNextActions } from "./components/GlobalNextActions";
import { ProjectCard } from "./components/ProjectCard";
import { ReportFooter } from "./components/ReportFooter";
import { ReportHeader } from "./components/ReportHeader";
import "./styles/tokens.css";
import "./styles/report.css";

export function DailyReportPage({
  report
}: {
  report: DailyReport;
}): React.JSX.Element {
  return (
    <main
      id="daily-report"
      data-testid="daily-report"
      className="report-page"
    >
      <ReportHeader meta={report.meta} />

      <section className="project-list" aria-label="项目日报">
        {report.projects.map((project) => (
          <ProjectCard key={project.code} project={project} />
        ))}
      </section>

      <GlobalNextActions actions={report.globalNextActions} />
      <ReportFooter meta={report.meta} />
    </main>
  );
}
```

- [ ] **Step 5: Implement design tokens and long-image layout**

Create `src/template/styles/tokens.css`:

```css
:root {
  --report-width: 1080px;
  --report-min-height: 1920px;
  --report-padding-x: 72px;
  --report-padding-y: 72px;
  --report-gap: 28px;

  --color-page-bg: #f2f3f5;
  --color-card-bg: #ffffff;
  --color-primary: #16588f;
  --color-primary-dark: #0f4776;
  --color-accent: #f4a11a;
  --color-text-main: #16324a;
  --color-text-secondary: #667788;
  --color-border: #dce4eb;

  --color-completed-bg: #e6f4ea;
  --color-completed-text: #297a43;
  --color-progress-bg: #fff2d8;
  --color-progress-text: #a86800;
  --color-planned-bg: #e7f0f8;
  --color-planned-text: #35698f;
  --color-blocked-bg: #fce8e6;
  --color-blocked-text: #a33a30;

  --font-report: "Microsoft YaHei", "Segoe UI", sans-serif;
  --radius-card: 10px;
  --radius-major: 16px;
  --radius-badge: 999px;
  --shadow-card: 0 2px 8px rgb(25 49 70 / 6%);
}
```

Create `src/template/styles/report.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-width: var(--report-width);
  background: var(--color-page-bg);
}

body {
  font-family: var(--font-report);
  color: var(--color-text-main);
}

.report-page {
  display: flex;
  flex-direction: column;
  gap: var(--report-gap);
  width: var(--report-width);
  min-height: var(--report-min-height);
  height: auto;
  padding: var(--report-padding-y) var(--report-padding-x);
  overflow-wrap: anywhere;
  background: var(--color-page-bg);
}

.report-header {
  position: relative;
  min-height: 282px;
  padding: 36px 40px;
  overflow: hidden;
  color: white;
  background: var(--color-primary);
  border-radius: var(--radius-major);
}

.report-header__meta,
.report-footer,
.project-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.report-header__meta {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  opacity: 0.9;
}

.report-header h1 {
  max-width: 760px;
  margin: 50px 0 10px;
  font-size: 42px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.report-header p {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.14em;
  opacity: 0.82;
}

.header-decoration {
  position: absolute;
  right: 30px;
  bottom: 20px;
  left: 30px;
  width: calc(100% - 60px);
  height: 72px;
  fill: none;
  stroke: rgb(255 255 255 / 55%);
  stroke-width: 2;
}

.header-decoration circle {
  fill: var(--color-accent);
  stroke: none;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--report-gap);
}

.project-card,
.global-actions {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 28px 32px;
  overflow: visible;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.project-card__identity {
  min-width: 0;
}

.project-code,
.section-eyebrow {
  display: block;
  margin-bottom: 6px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.project-card h2,
.global-actions h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.35;
}

.project-summary {
  margin: 0;
  padding: 14px 16px;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.7;
  background: #f7f9fb;
  border-left: 4px solid var(--color-primary);
}

.project-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.content-section h3 {
  margin: 0 0 8px;
  color: var(--color-primary-dark);
  font-size: 16px;
  line-height: 1.4;
}

.content-section ul,
.global-actions ul {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.content-section li,
.global-actions li {
  position: relative;
  padding-left: 18px;
  font-size: 15px;
  line-height: 1.7;
  white-space: normal;
}

.content-section li::before,
.global-actions li::before {
  position: absolute;
  left: 2px;
  color: var(--color-primary);
  content: "•";
}

.status-badge {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-radius: var(--radius-badge);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
}

.status--completed {
  color: var(--color-completed-text);
  background: var(--color-completed-bg);
}

.status--in-progress {
  color: var(--color-progress-text);
  background: var(--color-progress-bg);
}

.status--planned {
  color: var(--color-planned-text);
  background: var(--color-planned-bg);
}

.status--blocked {
  color: var(--color-blocked-text);
  background: var(--color-blocked-bg);
}

.report-footer {
  min-height: 148px;
  padding: 30px 36px;
  color: white;
  background: var(--color-primary-dark);
  border-radius: var(--radius-major);
}

.report-footer strong {
  font-size: 14px;
  letter-spacing: 0.12em;
}

.report-footer p {
  margin: 10px 0 0;
  font-size: 12px;
  opacity: 0.75;
}

.report-footer__meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  font-weight: 700;
}
```

- [ ] **Step 6: Run component tests and type checking**

Run:

```powershell
npm test -- tests/components
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit the template**

```powershell
git add src/template tests/components
git commit -m "feat: implement daily report react template"
```

---

### Task 6: Start the Loopback Render Server and Mark Browser Readiness

**Files:**
- Create: `index.html`
- Create: `src/app/main.tsx`
- Create: `src/app/render-readiness.ts`
- Create: `src/server/start-render-server.ts`
- Test: `tests/server/start-render-server.test.ts`

**Interfaces:**
- Consumes: `DailyReport`.
- Produces: `startRenderServer(report): Promise<{ url: string; close(): Promise<void> }>` bound to `127.0.0.1`.
- Browser endpoint: `GET /__report-data.json`.
- Browser readiness states: `loading`, `ready`, or `error` in `document.body.dataset.renderStatus`.

- [ ] **Step 1: Write the failing server test**

Create `tests/server/start-render-server.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DailyReport } from "../../src/schema/report-types";
import { startRenderServer } from "../../src/server/start-render-server";

const report: DailyReport = {
  meta: {
    title: "个人日报",
    date: "2026-08-01",
    owner: "Wenzel"
  },
  projects: [
    {
      code: "PRJ-001",
      title: "项目",
      status: "planned",
      summary: "摘要。",
      progress: ["进展。"],
      issues: [],
      next: ["下一步。"]
    }
  ],
  globalNextActions: ["继续。"]
};

describe("startRenderServer", () => {
  it("serves report JSON from loopback", async () => {
    const server = await startRenderServer(report);

    try {
      expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:/);
      const response = await fetch(`${server.url}/__report-data.json`);
      expect(response.ok).toBe(true);
      expect(await response.json()).toEqual(report);
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 2: Run the server test and verify failure**

Run:

```powershell
npm test -- tests/server/start-render-server.test.ts
```

Expected: FAIL because the server module does not exist.

- [ ] **Step 3: Add the Vite HTML and React entry**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>Personal Daily Report Renderer</title>
  </head>
  <body data-render-status="loading">
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

Create `src/app/render-readiness.ts`:

```ts
async function waitForImages(): Promise<void> {
  const images = Array.from(document.images);

  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener(
          "error",
          () => reject(new Error(`Image failed: ${image.currentSrc}`)),
          { once: true }
        );
      });
    })
  );
}

export async function markRenderReady(): Promise<void> {
  await document.fonts.ready;
  await waitForImages();
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    )
  );
  document.body.dataset.renderStatus = "ready";
}
```

Create `src/app/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import type { DailyReport } from "../schema/report-types";
import { DailyReportPage } from "../template/DailyReportPage";
import { markRenderReady } from "./render-readiness";

async function bootstrap(): Promise<void> {
  document.body.dataset.renderStatus = "loading";

  const response = await fetch("/__report-data.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Report data request failed: ${response.status}`);
  }

  const report = (await response.json()) as DailyReport;
  const root = document.getElementById("root");

  if (!root) {
    throw new Error("Missing #root element");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <DailyReportPage report={report} />
    </React.StrictMode>
  );

  await markRenderReady();
}

bootstrap().catch((error: unknown) => {
  document.body.dataset.renderStatus = "error";
  document.body.dataset.renderError =
    error instanceof Error ? error.message : String(error);
  console.error(error);
});
```

- [ ] **Step 4: Implement the loopback-only Vite server**

Create `src/server/start-render-server.ts`:

```ts
import getPort from "get-port";
import { createServer, type ViteDevServer } from "vite";
import type { DailyReport } from "../schema/report-types";

export interface RenderServer {
  url: string;
  close(): Promise<void>;
}

export async function startRenderServer(
  report: DailyReport
): Promise<RenderServer> {
  const port = await getPort();
  const json = JSON.stringify(report);

  const vite: ViteDevServer = await createServer({
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true
    },
    appType: "spa",
    logLevel: "error",
    plugins: [
      {
        name: "daily-report-data",
        configureServer(server) {
          server.middlewares.use(
            "/__report-data.json",
            (_request, response) => {
              response.statusCode = 200;
              response.setHeader(
                "Content-Type",
                "application/json; charset=utf-8"
              );
              response.setHeader("Cache-Control", "no-store");
              response.end(json);
            }
          );
        }
      }
    ]
  });

  await vite.listen();

  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await vite.close();
    }
  };
}
```

- [ ] **Step 5: Run server and unit tests**

Run:

```powershell
npm test -- tests/server/start-render-server.test.ts
npm test
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit the render server**

```powershell
git add index.html src/app src/server tests/server
git commit -m "feat: add local react render server"
```

---

### Task 7: Validate Layout and Export PNG plus Single-Page PDF

**Files:**
- Create: `src/exporter/browser.ts`
- Create: `src/exporter/layout-checks.ts`
- Create: `src/exporter/export-artifacts.ts`
- Test: `tests/e2e/export-artifacts.spec.ts`

**Interfaces:**
- Produces: `withBrowser<T>(scale, operation): Promise<T>`.
- Produces: `measureAndValidateLayout(page): Promise<LayoutMeasurement>`.
- Produces: `exportArtifacts(input): Promise<ExportMeasurement>`.
- Rejects width other than 1080, horizontal overflow, clipped marked elements, render height above 16000, failed browser render, or missing root.

- [ ] **Step 1: Write the failing exporter E2E test**

Create `tests/e2e/export-artifacts.spec.ts`:

```ts
import { mkdtemp, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import type { DailyReport } from "../../src/schema/report-types";
import { startRenderServer } from "../../src/server/start-render-server";
import { exportArtifacts } from "../../src/exporter/export-artifacts";

const report: DailyReport = {
  meta: {
    title: "科研工程风个人日报",
    date: "2026-08-01",
    owner: "Wenzel"
  },
  projects: [
    {
      code: "PRJ-001",
      title: "日报生成器",
      status: "in-progress",
      summary: "实现本地无头渲染。",
      progress: ["完成 React 页面。"],
      issues: [],
      next: ["导出 PNG 和 PDF。"]
    }
  ],
  globalNextActions: ["完成第一版。"]
};

test("exports non-empty PNG and PDF", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "pdr-export-"));
  const server = await startRenderServer(report);

  try {
    const result = await exportArtifacts({
      url: server.url,
      pngPath: path.join(output, "report.png"),
      pdfPath: path.join(output, "report.pdf"),
      scale: 1
    });

    expect(result.cssWidth).toBe(1080);
    expect(result.cssHeight).toBeGreaterThanOrEqual(1920);
    expect((await stat(path.join(output, "report.png"))).size).toBeGreaterThan(0);
    expect((await stat(path.join(output, "report.pdf"))).size).toBeGreaterThan(0);
  } finally {
    await server.close();
  }
});
```

- [ ] **Step 2: Run the E2E test and verify failure**

Run:

```powershell
npx playwright test tests/e2e/export-artifacts.spec.ts
```

Expected: FAIL because exporter modules do not exist.

- [ ] **Step 3: Implement Chromium lifecycle**

Create `src/exporter/browser.ts`:

```ts
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from "playwright";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function withBrowser<T>(
  scale: 1 | 2,
  operation: (session: BrowserSession) => Promise<T>
): Promise<T> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: {
        width: 1080,
        height: 1000
      },
      deviceScaleFactor: scale,
      locale: "zh-CN",
      reducedMotion: "reduce"
    });

    const page = await context.newPage();
    await page.emulateMedia({ media: "screen" });

    return await operation({ browser, context, page });
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 4: Implement render waiting and layout checks**

Create `src/exporter/layout-checks.ts`:

```ts
import type { Page } from "playwright";
import {
  MAX_REPORT_HEIGHT,
  MIN_REPORT_HEIGHT,
  REPORT_WIDTH,
  WARN_REPORT_HEIGHT
} from "../core/constants";

export interface LayoutMeasurement {
  cssWidth: number;
  cssHeight: number;
  warning?: string;
}

async function waitForStableHeight(
  page: Page,
  selector: string
): Promise<number> {
  let previous = -1;
  let stableCount = 0;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const height = await page.locator(selector).evaluate(
      (element) => Math.ceil(element.getBoundingClientRect().height)
    );

    if (height === previous) {
      stableCount += 1;
      if (stableCount >= 3) return height;
    } else {
      stableCount = 0;
      previous = height;
    }

    await page.waitForTimeout(100);
  }

  throw new Error("Report layout did not stabilize");
}

export async function waitForRenderReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.body.dataset.renderStatus === "ready" ||
      document.body.dataset.renderStatus === "error",
    undefined,
    { timeout: 15_000 }
  );

  const status = await page.locator("body").getAttribute(
    "data-render-status"
  );

  if (status === "error") {
    const message = await page.locator("body").getAttribute(
      "data-render-error"
    );
    throw new Error(`Render page failed: ${message ?? "unknown error"}`);
  }

  await page.evaluate(() => document.fonts.ready);
}

export async function measureAndValidateLayout(
  page: Page
): Promise<LayoutMeasurement> {
  const root = page.locator("#daily-report");

  if ((await root.count()) !== 1) {
    throw new Error("Expected exactly one #daily-report root");
  }

  const cssHeight = await waitForStableHeight(page, "#daily-report");

  const values = await root.evaluate((element) => {
    const html = element as HTMLElement;
    return {
      width: Math.ceil(html.getBoundingClientRect().width),
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      clippedElements: Array.from(
        html.querySelectorAll<HTMLElement>(
          "[data-check-clipping='true']"
        )
      )
        .filter(
          (node) =>
            node.scrollHeight > node.clientHeight ||
            node.scrollWidth > node.clientWidth
        )
        .map((node) => node.textContent?.slice(0, 80) ?? "")
    };
  });

  if (values.width !== REPORT_WIDTH) {
    throw new Error(
      `Report width must be ${REPORT_WIDTH}px, received ${values.width}px`
    );
  }

  if (
    values.scrollWidth !== values.clientWidth ||
    values.scrollWidth !== REPORT_WIDTH
  ) {
    throw new Error(
      `Horizontal overflow detected: scrollWidth=${values.scrollWidth}, clientWidth=${values.clientWidth}`
    );
  }

  if (values.clippedElements.length > 0) {
    throw new Error(
      `Clipped content detected: ${values.clippedElements.join(" | ")}`
    );
  }

  if (cssHeight < MIN_REPORT_HEIGHT) {
    throw new Error(
      `Report height is below ${MIN_REPORT_HEIGHT}px: ${cssHeight}px`
    );
  }

  if (cssHeight > MAX_REPORT_HEIGHT) {
    throw new Error(
      `Report height exceeds ${MAX_REPORT_HEIGHT}px: ${cssHeight}px`
    );
  }

  return {
    cssWidth: values.width,
    cssHeight,
    warning:
      cssHeight > WARN_REPORT_HEIGHT
        ? `Report height exceeds ${WARN_REPORT_HEIGHT}px`
        : undefined
  };
}
```

- [ ] **Step 5: Implement PNG and long-page PDF export**

Create `src/exporter/export-artifacts.ts`:

```ts
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
```

- [ ] **Step 6: Mark text containers for clipping checks**

Add `data-check-clipping="true"` to the project title, summary, list items, Header title, and Footer text. Example change in `ProjectCard.tsx`:

```tsx
<h2 data-check-clipping="true">{project.title}</h2>
<p className="project-summary" data-check-clipping="true">
  {project.summary}
</p>
```

In `ContentSection.tsx`:

```tsx
<li data-check-clipping="true" key={`${title}-${index}`}>
  {item}
</li>
```

Do the equivalent for Header and Footer text nodes.

- [ ] **Step 7: Run the exporter E2E test**

Run:

```powershell
npx playwright test tests/e2e/export-artifacts.spec.ts
npx tsc --noEmit
```

Expected: PASS and both files are non-empty.

- [ ] **Step 8: Commit exporter behavior**

```powershell
git add src/exporter src/template tests/e2e/export-artifacts.spec.ts
git commit -m "feat: export long png and pdf reports"
```

---

### Task 8: Orchestrate Generation, Cache Repeated Runs, and Expose the CLI

**Files:**
- Create: `src/core/result.ts`
- Create: `src/core/generate-report.ts`
- Create: `src/cli/arguments.ts`
- Create: `src/cli/console-reporter.ts`
- Create: `src/cli/index.ts`
- Test: `tests/core/generate-report.test.ts`
- Test: `tests/cli/arguments.test.ts`

**Interfaces:**
- Produces: `generateReport(options): Promise<GenerateReportResult>`.
- Produces: `parseCliArguments(argv): CliOptions`.
- CLI command: `npm run report -- <markdown-file> [--scale 1|2] [--open] [--dry-run] [--force] [--verbose]`.
- `dryRun` parses and validates but does not start Vite or Chromium.

- [ ] **Step 1: Write failing orchestration and CLI tests**

Create `tests/cli/arguments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseCliArguments } from "../../src/cli/arguments";

describe("parseCliArguments", () => {
  it("uses scale 1 by default", () => {
    const options = parseCliArguments(["node", "cli", "report.md"]);
    expect(options).toMatchObject({
      markdownFile: "report.md",
      scale: 1,
      dryRun: false,
      force: false
    });
  });

  it("accepts scale 2", () => {
    const options = parseCliArguments([
      "node",
      "cli",
      "report.md",
      "--scale",
      "2"
    ]);
    expect(options.scale).toBe(2);
  });
});
```

Create `tests/core/generate-report.test.ts`:

```ts
import { cp, mkdtemp, mkdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateReport } from "../../src/core/generate-report";

describe("generateReport", () => {
  it("supports dry-run without creating rendered output", async () => {
    const projectRoot = await mkdtemp(
      path.join(os.tmpdir(), "pdr-dry-run-")
    );
    const sourceDir = path.join(
      projectRoot,
      "reports",
      "source",
      "2026",
      "08"
    );
    await mkdir(sourceDir, { recursive: true });
    const sourcePath = path.join(sourceDir, "2026-08-01.md");
    await cp(
      path.resolve("tests/fixtures/valid-basic.md"),
      sourcePath
    );

    const result = await generateReport({
      sourcePath,
      projectRoot,
      scale: 1,
      dryRun: true,
      force: false,
      verbose: false
    });

    expect(result.status).toBe("dry-run");
    await expect(
      stat(path.join(projectRoot, "reports", "rendered"))
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- tests/cli/arguments.test.ts tests/core/generate-report.test.ts
```

Expected: FAIL because orchestration modules do not exist.

- [ ] **Step 3: Implement CLI option parsing**

Create `src/cli/arguments.ts`:

```ts
import { Command, Option } from "commander";

export interface CliOptions {
  markdownFile: string;
  scale: 1 | 2;
  open: boolean;
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
}

export function parseCliArguments(argv: string[]): CliOptions {
  const program = new Command();

  program
    .name("daily-report")
    .argument("<markdown-file>")
    .addOption(
      new Option("--scale <scale>", "PNG scale")
        .choices(["1", "2"])
        .default("1")
    )
    .option("--open", "open output directory after success", false)
    .option("--dry-run", "parse and validate only", false)
    .option("--force", "ignore cache and regenerate", false)
    .option("--verbose", "show detailed logging", false)
    .exitOverride();

  program.parse(argv);
  const raw = program.opts<{
    scale: "1" | "2";
    open: boolean;
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
  }>();

  return {
    markdownFile: program.args[0],
    scale: Number(raw.scale) as 1 | 2,
    open: raw.open,
    dryRun: raw.dryRun,
    force: raw.force,
    verbose: raw.verbose
  };
}
```

- [ ] **Step 4: Define result types**

Create `src/core/result.ts`:

```ts
import type { DailyReport } from "../schema/report-types";
import type { ReportManifest } from "../storage/manifest";

export type GenerateReportResult =
  | {
      status: "dry-run";
      report: DailyReport;
      warnings: string[];
    }
  | {
      status: "cached";
      outputDir: string;
      warnings: string[];
    }
  | {
      status: "generated";
      outputDir: string;
      manifest: ReportManifest;
      warnings: string[];
    };
```

- [ ] **Step 5: Implement the generation orchestrator**

Create `src/core/generate-report.ts`:

```ts
import {
  access,
  mkdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { exportArtifacts } from "../exporter/export-artifacts";
import { parseReportFile } from "../parser/parse-report";
import { startRenderServer } from "../server/start-render-server";
import {
  isOutputCurrent,
  sha256File
} from "../storage/cache";
import { createManifest } from "../storage/manifest";
import { resolveReportPaths } from "../storage/paths";
import { publishRunDirectory } from "../storage/publish";
import {
  GENERATOR_VERSION,
  TEMPLATE_NAME,
  TEMPLATE_VERSION
} from "./constants";
import type { GenerateReportResult } from "./result";

export interface GenerateReportOptions {
  sourcePath: string;
  projectRoot: string;
  scale: 1 | 2;
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
}

async function requireMarkdownFile(filePath: string): Promise<void> {
  if (path.extname(filePath).toLowerCase() !== ".md") {
    throw new Error(`Input must be a .md file: ${filePath}`);
  }

  await access(filePath);
  const value = await stat(filePath);

  if (!value.isFile()) {
    throw new Error(`Input is not a file: ${filePath}`);
  }
}

export async function generateReport(
  options: GenerateReportOptions
): Promise<GenerateReportResult> {
  const sourcePath = path.resolve(options.sourcePath);
  await requireMarkdownFile(sourcePath);

  const report = await parseReportFile(sourcePath);
  const warnings: string[] = [];

  if (report.projects.length > 8) {
    warnings.push(
      `Project count ${report.projects.length} exceeds the recommended limit 8`
    );
  }

  if (options.dryRun) {
    return {
      status: "dry-run",
      report,
      warnings
    };
  }

  const sourceHash = await sha256File(sourcePath);
  const runId = `run-${Date.now()}-${process.pid}`;
  const paths = resolveReportPaths(
    sourcePath,
    report.meta.date,
    options.projectRoot,
    runId
  );

  const fingerprint = {
    sourceHash,
    templateVersion: TEMPLATE_VERSION,
    generatorVersion: GENERATOR_VERSION,
    scale: options.scale
  };

  if (
    !options.force &&
    (await isOutputCurrent(paths.finalOutputDir, fingerprint))
  ) {
    return {
      status: "cached",
      outputDir: paths.finalOutputDir,
      warnings
    };
  }

  await mkdir(paths.tempOutputDir, { recursive: true });

  const server = await startRenderServer(report);

  try {
    const measurement = await exportArtifacts({
      url: server.url,
      pngPath: paths.tempPngPath,
      pdfPath: paths.tempPdfPath,
      scale: options.scale
    });

    if (measurement.warning) {
      warnings.push(measurement.warning);
    }

    await writeFile(
      paths.tempJsonPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8"
    );

    const manifest = createManifest({
      source: path.relative(options.projectRoot, sourcePath),
      sourceHash,
      reportDate: report.meta.date,
      template: {
        name: TEMPLATE_NAME,
        version: TEMPLATE_VERSION
      },
      generatorVersion: GENERATOR_VERSION,
      generatedAt: new Date().toISOString(),
      render: {
        cssWidth: measurement.cssWidth,
        cssHeight: measurement.cssHeight,
        scale: options.scale,
        pngWidth: measurement.pngWidth,
        pngHeight: measurement.pngHeight
      }
    });

    await writeFile(
      paths.tempManifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    );

    await publishRunDirectory(
      paths.tempOutputDir,
      paths.finalOutputDir
    );

    return {
      status: "generated",
      outputDir: paths.finalOutputDir,
      manifest,
      warnings
    };
  } finally {
    await server.close();
    await rm(paths.runRoot, { recursive: true, force: true });
  }
}
```

- [ ] **Step 6: Implement deterministic terminal output**

Create `src/cli/console-reporter.ts`:

```ts
import path from "node:path";
import type { GenerateReportResult } from "../core/result";
import { ParseReportError } from "../parser/parse-error";

export function printResult(result: GenerateReportResult): void {
  console.log("Personal Daily Reports");
  console.log("");

  if (result.status === "dry-run") {
    console.log("Parse");
    console.log("  ✓ Markdown parsed");
    console.log(`  ✓ ${result.report.projects.length} projects`);
    console.log("  ✓ Schema validation");
  } else if (result.status === "cached") {
    console.log("Cache");
    console.log("  ✓ Output is current");
    console.log(`  ${result.outputDir}`);
  } else {
    console.log("Export");
    console.log("  ✓ report.png");
    console.log("  ✓ report.pdf");
    console.log("  ✓ report.json");
    console.log("  ✓ manifest.json");
    console.log("");
    console.log("Output");
    console.log(`  ${result.outputDir}`);
    console.log(
      `  ${result.manifest.render.pngWidth} × ${result.manifest.render.pngHeight}px`
    );
  }

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

export function printError(error: unknown): void {
  if (error instanceof ParseReportError) {
    console.error(error.message);
    console.error("");
    console.error("File:");
    console.error(`  ${error.filePath}`);
    console.error("");
    console.error("Location:");
    console.error(`  line ${error.line}`);
    return;
  }

  const message =
    error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error(`Working directory: ${path.resolve(".")}`);
}
```

- [ ] **Step 7: Implement the CLI entry**

Create `src/cli/index.ts`:

```ts
#!/usr/bin/env node
import path from "node:path";
import open from "open";
import { generateReport } from "../core/generate-report";
import { parseCliArguments } from "./arguments";
import { printError, printResult } from "./console-reporter";

async function main(): Promise<void> {
  const options = parseCliArguments(process.argv);
  const sourcePath = path.resolve(options.markdownFile);

  const result = await generateReport({
    sourcePath,
    projectRoot: process.cwd(),
    scale: options.scale,
    dryRun: options.dryRun,
    force: options.force,
    verbose: options.verbose
  });

  printResult(result);

  if (
    options.open &&
    result.status !== "dry-run"
  ) {
    await open(result.outputDir);
  }
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
```

- [ ] **Step 8: Run unit tests and a real dry run**

Run:

```powershell
npm test -- tests/cli/arguments.test.ts tests/core/generate-report.test.ts
npm run report -- tests/fixtures/valid-basic.md --dry-run
```

Expected dry-run output includes:

```text
✓ Markdown parsed
✓ 1 projects
✓ Schema validation
```

The fixture filename is not a date, so for the actual command copy it first:

```powershell
New-Item -ItemType Directory -Force 'reports\source\2026\08' | Out-Null
Copy-Item 'tests\fixtures\valid-basic.md' 'reports\source\2026\08\2026-08-01.md' -Force
npm run report -- 'reports\source\2026\08\2026-08-01.md' --dry-run
```

Expected: exit code 0.

- [ ] **Step 9: Commit orchestration and CLI**

```powershell
git add src/core src/cli tests/core tests/cli reports/source/2026/08/2026-08-01.md
git commit -m "feat: add daily report command line workflow"
```

---

### Task 9: Add End-to-End Artifact Validation and Visual Regression

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/fixtures/visual-reference.md`
- Create: `tests/fixtures/valid-long.md`
- Create: `tests/e2e/export-report.spec.ts`
- Create: `tests/e2e/visual-report.spec.ts`
- Create: `tests/e2e/height-limits.spec.ts`
- Generate: Playwright snapshot under `tests/e2e/visual-report.spec.ts-snapshots/`

**Interfaces:**
- Consumes: `generateReport`, `parseReportFile`, `startRenderServer`.
- Verifies: PNG dimensions, one-page PDF, manifest values, cache hit, visual difference ratio `<= 0.005`, long-content warning, and `>16000px` rejection.

- [ ] **Step 1: Configure Playwright Test**

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    locale: "zh-CN",
    viewport: {
      width: 1080,
      height: 1000
    },
    reducedMotion: "reduce"
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      animations: "disabled"
    }
  }
});
```

- [ ] **Step 2: Create the fixed visual fixture**

Create `tests/fixtures/visual-reference.md` with three projects and all four statuses represented across this file and `valid-long.md`. Use the same fixed headings and fields as `valid-basic.md`; include:

```text
PRJ-HC       in-progress
PRJ-SFA      completed
PRJ-PDR      planned
```

Each project must have two to four progress items, one issue item, and two next items. Keep the full document below 6000 CSS pixels so the reference image remains practical to review.

Create `tests/fixtures/valid-long.md` with eight projects. Include one project with:

```text
SamsungFinanceTransactionNormalizationService
```

and eight items in each section. This fixture must generate a page above 10000px but below 16000px.

- [ ] **Step 3: Write the full artifact test**

Create `tests/e2e/export-report.spec.ts`:

```ts
import {
  cp,
  mkdtemp,
  mkdir,
  readFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";
import { generateReport } from "../../src/core/generate-report";

test("generates complete artifacts and then uses cache", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "pdr-e2e-"));
  const sourceDir = path.join(
    projectRoot,
    "reports",
    "source",
    "2026",
    "08"
  );
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = path.join(sourceDir, "2026-08-01.md");
  await cp(
    path.resolve("tests/fixtures/visual-reference.md"),
    sourcePath
  );

  const first = await generateReport({
    sourcePath,
    projectRoot,
    scale: 1,
    dryRun: false,
    force: false,
    verbose: false
  });

  expect(first.status).toBe("generated");
  if (first.status !== "generated") throw new Error("expected generated");

  const pngBytes = await readFile(
    path.join(first.outputDir, "report.png")
  );
  const png = PNG.sync.read(pngBytes);
  expect(png.width).toBe(1080);
  expect(png.height).toBe(first.manifest.render.cssHeight);

  const pdfBytes = await readFile(
    path.join(first.outputDir, "report.pdf")
  );
  const pdf = await PDFDocument.load(pdfBytes);
  expect(pdf.getPageCount()).toBe(1);

  const manifest = JSON.parse(
    await readFile(
      path.join(first.outputDir, "manifest.json"),
      "utf8"
    )
  );
  expect(manifest.reportDate).toBe("2026-08-01");
  expect(manifest.outputs.png).toBe("report.png");

  const second = await generateReport({
    sourcePath,
    projectRoot,
    scale: 1,
    dryRun: false,
    force: false,
    verbose: false
  });

  expect(second.status).toBe("cached");
});
```

- [ ] **Step 4: Write the visual regression test**

Create `tests/e2e/visual-report.spec.ts`:

```ts
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
```

- [ ] **Step 5: Create the baseline and review it manually**

Run:

```powershell
npx playwright test tests/e2e/visual-report.spec.ts --update-snapshots
```

Open the generated snapshot and compare it side-by-side with `template-reference/figma-reference.png`. Do not accept the baseline until these properties are visually correct:

- 1080 px frame width
- Header height and padding
- Main title scale
- Project card width and vertical gap
- Status colors
- Body line height
- Footer height
- No clipped content
- No unexpected browser margin

After corrections, rerun `--update-snapshots` once and review again.

- [ ] **Step 6: Test height warning and rejection**

Create `tests/e2e/height-limits.spec.ts`:

```ts
import path from "node:path";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { parseReportMarkdown } from "../../src/parser/parse-report";
import { startRenderServer } from "../../src/server/start-render-server";
import { exportArtifacts } from "../../src/exporter/export-artifacts";

test("warns for a long report below the hard maximum", async () => {
  const fixturePath = path.resolve("tests/fixtures/valid-long.md");
  const report = parseReportMarkdown(
    await readFile(fixturePath, "utf8"),
    "2026-08-01.md"
  );
  const server = await startRenderServer(report);

  try {
    const result = await exportArtifacts({
      url: server.url,
      pngPath: path.resolve("test-results/long-report.png"),
      pdfPath: path.resolve("test-results/long-report.pdf"),
      scale: 1
    });

    expect(result.cssHeight).toBeGreaterThan(10_000);
    expect(result.cssHeight).toBeLessThanOrEqual(16_000);
    expect(result.warning).toMatch(/10000/);
  } finally {
    await server.close();
  }
});
```

For the hard-limit test, create the report object in the test by repeating a 120-character list item until the page exceeds 16000px, then assert `exportArtifacts` rejects with `/exceeds 16000px/`. Do not create or commit a massive Markdown fixture for this one case.

- [ ] **Step 7: Run the complete test suite**

Run:

```powershell
npm run test
npm run test:e2e
npm run build
```

Expected: all unit, component, parser, storage, E2E, PDF, PNG, cache, height, and visual tests PASS.

- [ ] **Step 8: Commit E2E and visual coverage**

```powershell
git add playwright.config.ts tests/e2e tests/fixtures tests/e2e/visual-report.spec.ts-snapshots
git commit -m "test: add report export and visual regression coverage"
```

---

### Task 10: Record the Figma Reference, Document Use, and Run Final Acceptance

**Files:**
- Create: `template-reference/design-spec.md`
- Add: `template-reference/figma-reference.png`
- Create: `README.md`
- Modify: `reports/source/2026/08/2026-08-01.md` if required to match the accepted daily content

**Interfaces:**
- Documents the one-command local workflow.
- Establishes the human visual reference and production design tokens.
- Does not add Figma to the runtime.

- [ ] **Step 1: Export and save the Figma reference**

In Figma:

1. Select `Main Daily Report / 1080`.
2. Export PNG at `1x`.
3. Confirm exported width is 1080 px.
4. Save it directly as:

```text
template-reference/figma-reference.png
```

Do not export the Figma canvas background or component showcase page.

- [ ] **Step 2: Create the design specification**

Create `template-reference/design-spec.md`:

```md
# Personal Daily Report Visual Specification

## Authority

- Figma is the visual design reference.
- React/CSS is the production rendering implementation.
- The daily CLI does not call Figma.

## Frame

- Width: 1080 px
- Minimum height: 1920 px
- Background: `#F2F3F5`
- Horizontal padding: 72 px
- Vertical padding: 72 px
- Major section gap: 28 px

## Header

- Background: `#16588F`
- Radius: 16 px
- Padding: 36 px 40 px
- Minimum height: 282 px
- Main title: 42 px, weight 700, line height 1.2

## Project Card

- Background: `#FFFFFF`
- Border: `1px solid #DCE4EB`
- Radius: 10 px
- Padding: 28 px 32 px
- Internal gap: 18 px
- Height: automatic

## Typography

- Windows runtime stack: `"Microsoft YaHei", "Segoe UI", sans-serif`
- Project title: 24 px, weight 700, line height 1.35
- Body: 15 px, line height 1.7
- Labels: 10–11 px, weight 700–800

## Status Colors

- Completed: `#E6F4EA` / `#297A43`
- In progress: `#FFF2D8` / `#A86800`
- Planned: `#E7F0F8` / `#35698F`
- Blocked: `#FCE8E6` / `#A33A30`

## Long Content

- Do not reduce the font size.
- Do not crop cards or text.
- Do not paginate in v0.1.0.
- Grow the page vertically.
```

- [ ] **Step 3: Create the user README**

Create `README.md`:

```md
# Personal Daily Reports

Generate a 1080 px-wide daily-report PNG and single-page PDF from a fixed Markdown file.

## Requirements

- Windows
- Node.js 24 LTS
- npm
- Playwright Chromium

## Install

```powershell
Set-Location 'H:\Workshop\PDR\personal-daily-reports'
npm install
npx playwright install chromium
```

## Validate Markdown Only

```powershell
npm run report -- 'reports\source\2026\08\2026-08-01.md' --dry-run
```

## Generate PNG and PDF

```powershell
npm run report -- 'reports\source\2026\08\2026-08-01.md'
```

## Generate a 2x PNG

```powershell
npm run report -- 'reports\source\2026\08\2026-08-01.md' --scale 2
```

## Open the Output Directory

```powershell
npm run report -- 'reports\source\2026\08\2026-08-01.md' --open
```

## Force Regeneration

```powershell
npm run report -- 'reports\source\2026\08\2026-08-01.md' --force
```

## Output

```text
reports/rendered/2026/08/2026-08-01/
├── report.png
├── report.pdf
├── report.json
└── manifest.json
```

## Test

```powershell
npm run test:all
```

## Runtime Data Flow

```text
Markdown
→ strict parser
→ Zod validation
→ Report JSON
→ React/CSS
→ Playwright Chromium
→ PNG + PDF
```
```

- [ ] **Step 4: Run the final acceptance commands**

Run:

```powershell
Set-Location 'H:\Workshop\PDR\personal-daily-reports'

npm ci
npx playwright install chromium
npm run test:all

npm run report -- 'reports\source\2026\08\2026-08-01.md' --dry-run
npm run report -- 'reports\source\2026\08\2026-08-01.md' --force
npm run report -- 'reports\source\2026\08\2026-08-01.md'
```

Expected:

- `npm run test:all` exits 0.
- Dry-run finds the expected project count.
- Forced run returns `generated`.
- Immediate repeated run returns `cached`.
- `report.png` is exactly 1080 px wide at scale 1.
- `report.pdf` contains exactly one page.
- `report.json` matches the parsed Markdown.
- `manifest.json` records the correct date, versions, dimensions, and output names.
- No `.daily-report-cache\run-*` directory remains.
- No old valid output is lost after a deliberately induced failed run.

- [ ] **Step 5: Review Git state and commit documentation**

Run:

```powershell
git status --short
git diff --check
git add README.md template-reference reports/source
git commit -m "docs: document daily report workflow"
```

Expected: no uncommitted implementation files remain.

- [ ] **Step 6: Create the v0.1.0 checkpoint tag after all verification passes**

Run:

```powershell
git tag -a v0.1.0 -m "Personal Daily Reports v0.1.0"
git log --oneline --decorate -10
```

Expected: `v0.1.0` points to the fully tested local CLI implementation.

---

## Final Self-Review Checklist

Before execution is declared complete, verify the plan against the approved specification:

- [ ] Fixed Markdown schema is implemented without AI interpretation.
- [ ] Front Matter, project metadata, summary, three fixed sections, and global actions are parsed.
- [ ] File-name date equality is enforced.
- [ ] Zod validates status, code format, required lists, and duplicate codes.
- [ ] React root is exactly 1080 CSS pixels wide.
- [ ] Content grows vertically and no main content uses fixed height.
- [ ] Four status styles are implemented.
- [ ] Server listens only on `127.0.0.1`.
- [ ] Playwright waits for fonts, images, render status, and stable height.
- [ ] Horizontal overflow and clipping cause failure.
- [ ] Height warning and rejection thresholds match the specification.
- [ ] PNG and single-page long PDF are both generated.
- [ ] Temporary output is validated before publication.
- [ ] Failed publication restores the prior output.
- [ ] Cache compares source hash, template version, generator version, and scale.
- [ ] CLI supports `--scale`, `--open`, `--dry-run`, `--force`, and `--verbose`.
- [ ] Parser, schema, component, storage, E2E, PDF, PNG, cache, height, and visual tests exist.
- [ ] Figma remains a manual design reference only.
- [ ] GitHub automation and multi-template support remain outside v0.1.0.

## Official Reference Notes

- Node.js release policy and LTS versions: `https://nodejs.org/en/about/previous-releases`
- Vite getting started and Node requirements: `https://vite.dev/guide/`
- Playwright browser installation: `https://playwright.dev/docs/browsers`
- Playwright visual comparisons: `https://playwright.dev/docs/test-snapshots`
