# Blueprint Code Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有围栏代码块渲染为浅蓝蓝图卡片，使用 Cascadia Mono 16px，并在保持代码内部左对齐的同时让代码组整体居中；仅 `text` 代码块显示 `CORE WORKFLOW`。

**Architecture:** 保持 Markdown 解析和 PDF 导出链路不变。`MarkdownContent` 只负责依据 `language` 输出普通或流程变体及标签，`poster.css` 负责卡片视觉、字体、整体居中与内部左对齐；组件测试验证语义变体，Playwright 验证浏览器实际计算样式与视觉基线。

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Playwright, Vite.

## Global Constraints

- 所有围栏代码块使用浅蓝背景、蓝色细边框和 12px 圆角。
- 代码字号固定为 `16px`。
- 字体回退顺序固定为 `"Cascadia Mono", Consolas, "Microsoft YaHei", monospace`。
- 整组代码居中，代码内部必须保持 `text-align: left`。
- 只有语言标记不区分大小写等于 `text` 时显示 `CORE WORKFLOW`。
- 不安装字体、不下载 Web 字体、不修改日报 Markdown，也不改变 Markdown 解析与 PDF 输出规则。
- 保留用户当前修改的 `daily/2026-07/2026-07-28.md`，并忽略 `daily/2026-07/images/`。

---

### Task 1: 输出普通与流程代码块变体

**Files:**
- Modify: `tests/components/MarkdownPosterPage.test.tsx`
- Modify: `src/template/components/MarkdownContent.tsx`

**Interfaces:**
- Consumes: `MarkdownBlock` 的现有 `type: "code"`、`language?: string` 和 `code: string`。
- Produces: `.poster-code` 普通代码块；`.poster-code--workflow` 流程变体；仅流程变体包含 `.poster-code__label` 和文本 `CORE WORKFLOW`。

- [x] **Step 1: 写入失败的组件测试**

在组件测试的 `poster.blocks` 中追加一个 `language: "TEXT"` 的树形流程块：

```ts
{
  type: "code",
  language: "TEXT",
  code: "Mac: VS Code / Codex\n        |\n        v\nResearch Literature MCP"
}
```

在现有渲染测试中加入：

```ts
const regularCode = screen.getByText('model_provider = "custom"');
const workflowCode = screen.getByText("Mac: VS Code / Codex", {
  exact: false
});

expect(regularCode.closest("pre")).toHaveClass("poster-code");
expect(regularCode.closest("pre")).not.toHaveClass(
  "poster-code--workflow"
);
expect(workflowCode.closest("pre")).toHaveClass(
  "poster-code",
  "poster-code--workflow"
);
expect(screen.getAllByText("CORE WORKFLOW")).toHaveLength(1);
```

- [x] **Step 2: 运行测试并确认按预期失败**

Run: `npm.cmd run test -- tests/components/MarkdownPosterPage.test.tsx`

Expected: FAIL，因为现有 `<pre>` 没有变体类，也没有 `CORE WORKFLOW` 标签。

- [x] **Step 3: 实现最小组件变体**

将 `MarkdownContent` 的代码块分支改为：

```tsx
if (block.type === "code") {
  const isWorkflow = block.language?.toLowerCase() === "text";
  const className = isWorkflow
    ? "poster-code poster-code--workflow"
    : "poster-code";

  return (
    <pre key={key} className={className}>
      {isWorkflow ? (
        <span className="poster-code__label">CORE WORKFLOW</span>
      ) : null}
      <code data-language={block.language}>{block.code}</code>
    </pre>
  );
}
```

- [x] **Step 4: 运行组件测试并确认通过**

Run: `npm.cmd run test -- tests/components/MarkdownPosterPage.test.tsx`

Expected: PASS，普通代码无标签，大小写形式 `TEXT` 被识别为流程变体。

- [x] **Step 5: 提交组件变体**

```powershell
git add src/template/components/MarkdownContent.tsx tests/components/MarkdownPosterPage.test.tsx
git commit -m "feat: distinguish workflow code blocks"
```

### Task 2: 应用蓝图视觉并验证树形对齐

**Files:**
- Modify: `src/template/styles/poster.css`
- Modify: `tests/e2e/visual-report.spec.ts`
- Modify: `tests/e2e/visual-report.spec.ts-snapshots/daily-report-standard-win32.png`

**Interfaces:**
- Consumes: Task 1 输出的 `.poster-code`、`.poster-code--workflow`、`.poster-code__label` 和直接子元素 `<code>`。
- Produces: 所有围栏代码块的浅蓝蓝图视觉、Cascadia Mono 16px、居中的代码组、左对齐的代码文本以及可见的流程标签。

- [x] **Step 1: 扩展端到端夹具并写入失败的计算样式断言**

在视觉基线使用的 `poster.blocks` 末尾追加：

```ts
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
```

将字号测试扩展为浏览器实际样式测试：

```ts
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
```

Run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts -g "fenced code blocks"`

Expected: FAIL，因为现有代码块使用深色背景、默认字体，且代码子元素没有按新的组居中规则布局。

- [x] **Step 2: 实现蓝图卡片样式**

用以下规则替换现有 `.poster-content pre` 样式，并新增子元素规则：

```css
.poster-content pre {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  overflow: visible;
  color: #183548;
  font-size: 16px;
  line-height: 1.65;
  background: #edf6fb;
  border: 1px solid #7db4d3;
  border-radius: 12px;
}

.poster-content pre > code {
  display: block;
  width: max-content;
  max-width: 100%;
  color: inherit;
  font-family: "Cascadia Mono", Consolas, "Microsoft YaHei", monospace;
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.poster-code__label {
  padding: 6px 12px;
  color: #fff;
  font-family: var(--font-report);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: var(--color-primary);
  border-radius: 999px;
}
```

- [x] **Step 3: 运行计算样式测试并确认通过**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts -g "fenced code blocks"`

Expected: PASS；代码组中心与卡片中心偏差小于 2px，代码文本保持左对齐并使用 Cascadia Mono。

- [x] **Step 4: 更新视觉基线并检查树形缩进**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-report.spec.ts --update-snapshots`

Expected: PASS，并更新 `daily-report-standard-win32.png`。人工检查普通代码无标签、流程代码有一个标签、浅蓝卡片完整、树形竖线和层级未被逐行居中破坏、无裁切。

- [x] **Step 5: 运行完整验证**

Run: `npm.cmd run test:all`

Expected: 组件测试、全部端到端测试和 TypeScript/Vite 构建均通过。

- [x] **Step 6: 提交视觉实现**

```powershell
git add src/template/styles/poster.css tests/e2e/visual-report.spec.ts tests/e2e/visual-report.spec.ts-snapshots/daily-report-standard-win32.png
git commit -m "style: add blueprint code blocks"
```

## Self-Review

- Spec coverage: Task 1 覆盖语言变体与标签规则；Task 2 覆盖浅蓝视觉、字体、16px、整组居中、内部左对齐、换行、快照和完整验证。
- Placeholder scan: 计划未发现占位标记、空步骤或未定义实现。
- Type consistency: 计划继续使用现有 `MarkdownBlock`、`PosterDocument`、`parseMarkdownFile` 和 `startRenderServer`，未引入新类型或依赖。
- Scope check: 不修改解析器、日报 Markdown、PDF 路径或生成规则；用户的 `2026-07-28.md` 和 `images/` 不进入提交。
