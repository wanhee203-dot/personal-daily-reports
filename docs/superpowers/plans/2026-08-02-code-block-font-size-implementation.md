# Code Block Font Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render fenced code blocks in the long-poster PDF at 16px, matching normal body text.

**Architecture:** Keep the Markdown and PDF pipeline unchanged. Add an end-to-end assertion against the browser's computed `font-size` for the rendered fenced code block, then make the smallest CSS declaration change required for that observable result.

**Tech Stack:** React, CSS, Playwright, Vitest, TypeScript, Vite.

## Global Constraints

- Change only fenced code blocks styled by `.poster-content pre`.
- Use `16px`; do not alter headings, ordinary text, inline code, output locations, or PDF generation.
- Do not add dependencies.

---

### Task 1: Render fenced code blocks at the body-text size

**Files:**
- Modify: `tests/e2e/visual-report.spec.ts`
- Modify: `src/template/styles/poster.css`

**Interfaces:**
- Consumes: `MarkdownPosterPage` renders fenced Markdown code as a `pre` element inside `#daily-report`.
- Produces: Browser-computed `font-size` of `16px` for the report's fenced code block.

- [x] **Step 1: Write the failing end-to-end expectation**

Add this test after the existing visual-baseline test:

```ts
test("renders fenced code blocks at the body-text size", async ({ page }) => {
  const fixturePath = path.resolve("tests", "fixtures", "plain-daily.md");
  const markdown = await parseMarkdownFile(fixturePath, path.resolve("."));
  const server = await startRenderServer({
    ...markdown,
    dateLabel: "2026-07-30-31",
    sourceName: "2026-07-30-31.md"
  });

  try {
    await page.goto(server.url);
    await page.waitForFunction(() => document.body.dataset.renderStatus === "ready");
    await expect(page.locator("#daily-report pre")).toHaveCSS("font-size", "16px");
  } finally {
    await server.close();
  }
});
```

- [x] **Step 2: Run the test to verify the expected failure**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts -g "fenced code blocks"`

Expected: FAIL because the current computed value is `14px`.

- [x] **Step 3: Make the minimal style change**

In `.poster-content pre` in `src/template/styles/poster.css`, replace:

```css
font-size: 14px;
```

with:

```css
font-size: 16px;
```

- [x] **Step 4: Verify the focused test and refresh the visual baseline**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts -g "fenced code blocks"`

Expected: PASS.

Then run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts --update-snapshots`

Expected: PASS and update `tests/e2e/visual-report.spec.ts-snapshots/daily-report-standard-win32.png` only if the larger code text changes the baseline.

- [x] **Step 5: Run full verification and commit**

Run: `npm.cmd run test:all`

Expected: all unit tests, end-to-end tests, and the TypeScript/Vite build pass.

Commit:

```powershell
git add src/template/styles/poster.css tests/e2e/visual-report.spec.ts tests/e2e/visual-report.spec.ts-snapshots/daily-report-standard-win32.png
git commit -m "style: increase code block font size"
```

## Self-Review

- Spec coverage: Task 1 covers the sole requirement: fenced code blocks use `16px` and no other typography rules change.
- Placeholder scan: no placeholder markers or deferred steps remain.
- Type consistency: the plan uses existing `PosterDocument`, `parseMarkdownFile`, and `startRenderServer` interfaces without additions.
