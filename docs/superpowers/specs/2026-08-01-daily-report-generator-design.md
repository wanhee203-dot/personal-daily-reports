# Personal Daily Reports：日报生成器设计规格

- **项目路径**：`H:\Workshop\PDR\personal-daily-reports`
- **规格日期**：2026-08-01
- **目标版本**：v0.1.0
- **状态**：待用户审核

## 1. 项目目标

构建一个在 Windows 本地运行的日报生成器。用户提供一份符合固定规范的 Markdown 日报，程序将其解析为标准化数据，使用 React/CSS 模板渲染为 1080 px 宽的单张长图，并通过 Playwright 导出 PNG 和单页长 PDF。

第一版只实现本地 CLI，不接入 GitHub Actions，不进行 Figma 自动同步，也不支持多模板。

最终使用方式：

```bash
npm run report -- reports/source/2026/08/2026-08-01.md
```

输出：

```text
reports/rendered/2026/08/2026-08-01/
├── report.png
├── report.pdf
├── report.json
└── manifest.json
```

## 2. 范围

### 2.1 第一版包含

- 固定格式 Markdown 输入
- YAML Front Matter
- 多项目日报解析
- Zod 数据校验
- React 固定日报模板
- 1080 px 固定宽度、自动高度
- Playwright 无头渲染
- PNG 导出
- 单页长 PDF 导出
- 临时目录和原子写入
- 生成清单 `manifest.json`
- Parser、Schema、组件和端到端测试
- Figma 参考图与 React 输出的视觉对比
- 本地 CLI 参数

### 2.2 第一版不包含

- Git 自动提交和推送
- GitHub Actions
- 多模板切换
- Figma MCP 或 Figma API 自动同步
- 自动分页
- Web 编辑器
- 大模型自由解析
- 日报历史统计
- 项目内图片
- Markdown 表格和嵌套列表

## 3. Figma 的角色

Figma 只作为视觉设计和验收基准，不进入每日生成链路。

职责划分：

| 内容 | 权威来源 |
|---|---|
| 视觉设计 | Figma |
| 页面实现 | React/CSS |
| 日报内容 | Markdown |
| 中间数据 | Report JSON |
| PNG/PDF 导出 | Playwright |
| 归档 | 本地文件系统，后续接 GitHub |

设计修改流程：

```text
Figma 修改设计
→ 人工同步 React/CSS
→ 生成测试图片
→ 与 Figma 参考图对比
→ 更新模板版本
```

## 4. 总体架构

```text
Markdown
→ Markdown Parser
→ DailyReport 原始对象
→ Zod Schema 校验
→ 标准 Report JSON
→ React/CSS 模板
→ 本地 HTTP 渲染页面
→ Playwright Chromium
→ PNG + PDF
→ manifest.json
```

系统分为四个独立模块：

1. **Parser**：将固定 Markdown 转换为原始对象。
2. **Schema**：校验和标准化数据。
3. **Renderer**：根据 Report JSON 生成 React 页面。
4. **Exporter**：启动浏览器、检查布局并导出 PNG/PDF。

模块之间只通过标准化 `DailyReport` 数据交互。

## 5. 推荐目录结构

```text
personal-daily-reports/
├── reports/
│   ├── source/
│   │   └── 2026/
│   │       └── 08/
│   │           └── 2026-08-01.md
│   └── rendered/
│       └── 2026/
│           └── 08/
│               └── 2026-08-01/
│                   ├── report.png
│                   ├── report.pdf
│                   ├── report.json
│                   └── manifest.json
│
├── src/
│   ├── parser/
│   │   ├── parse-report.ts
│   │   └── markdown-rules.ts
│   ├── schema/
│   │   ├── report-schema.ts
│   │   └── report-types.ts
│   ├── template/
│   │   ├── DailyReportPage.tsx
│   │   ├── components/
│   │   │   ├── ReportHeader.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ContentSection.tsx
│   │   │   ├── GlobalNextActions.tsx
│   │   │   └── ReportFooter.tsx
│   │   └── styles/
│   │       ├── tokens.css
│   │       └── report.css
│   ├── exporter/
│   │   ├── browser.ts
│   │   ├── export-png.ts
│   │   ├── export-pdf.ts
│   │   └── layout-checks.ts
│   └── cli/
│       ├── index.ts
│       └── arguments.ts
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── template-reference/
│   ├── figma-reference.png
│   └── design-spec.md
│
├── tests/
│   ├── fixtures/
│   ├── parser/
│   ├── schema/
│   ├── components/
│   ├── e2e/
│   └── visual/
│       ├── baselines/
│       ├── current/
│       └── diffs/
│
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-08-01-daily-report-generator-design.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 6. Markdown 输入规范

### 6.1 完整示例

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

> Step 3 网格稀疏化已经完成，目前进入程序运行和后处理调试阶段。

### 今日进展

- 完成近场密、远场稀的非均匀三角网格。
- 网格数量约为六万。
- 检查 Step 3 输入文件和边界条件。

### 当前问题

- 后处理程序尚未完整跑通。
- 部分变量传递逻辑仍需确认。

### 下一步

- 跑通完整计算流程。
- 理解后处理程序的数据结构。

## Samsung Finance Analysis

code: PRJ-SFA
status: completed

> V1 版本的核心功能已经完成。

### 今日进展

- 完成微信支付通知识别。
- 完成微信 XLSX 和支付宝 CSV 账单导入。
- 完成标准交易数据保存。

### 当前问题

- 暂无。

### 下一步

- 补充数据统计功能。
- 完善交易分类规则。

## 全局下一步计划

- 跑通 HC 酸蚀程序。
- 整理个人日报自动化程序。
- 规划 Samsung Finance Analysis V2。
```

### 6.2 Front Matter

| 字段 | 必填 | 规则 |
|---|---:|---|
| `title` | 是 | 非空字符串 |
| `date` | 是 | `YYYY-MM-DD` |
| `owner` | 是 | 非空字符串 |
| `version` | 否 | 模板或日报版本 |
| `subtitle` | 否 | Header 英文副标题 |

文件名必须与日期一致：

```text
2026-08-01.md
date: 2026-08-01
```

### 6.3 项目规则

每个普通二级标题代表一个项目：

```md
## 项目名称
```

每个项目必须包含：

- `code`
- `status`
- 摘要引用块
- `### 今日进展`
- `### 当前问题`
- `### 下一步`

项目编号规则：

```regex
^[A-Z0-9-]+$
```

允许状态：

```text
completed
in-progress
planned
blocked
```

### 6.4 全局计划

固定使用：

```md
## 全局下一步计划
```

其下必须是无序列表。

### 6.5 空问题标准化

以下内容：

```md
### 当前问题

- 暂无。
```

转换为：

```json
"issues": []
```

页面统一显示“暂无待解决问题”。

## 7. 数据模型

```ts
type ProjectStatus =
  | "completed"
  | "in-progress"
  | "planned"
  | "blocked";

interface ReportMeta {
  title: string;
  date: string;
  owner: string;
  version?: string;
  subtitle?: string;
}

interface ReportProject {
  code: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  progress: string[];
  issues: string[];
  next: string[];
}

interface DailyReport {
  meta: ReportMeta;
  projects: ReportProject[];
  globalNextActions: string[];
}
```

## 8. 校验规则

### 8.1 文件级

- 输入文件存在
- 扩展名为 `.md`
- 文件采用 UTF-8
- Front Matter 位于文件开头
- `title`、`date`、`owner` 存在
- 日期格式正确
- 文件名日期与 YAML 日期一致
- 至少包含一个项目
- 包含全局下一步计划

### 8.2 项目级

- 标题非空
- `code` 存在且格式合法
- `code` 在当前日报内唯一
- `status` 属于允许值
- 摘要非空
- 三个固定栏目全部存在
- 栏目使用无序列表
- 今日进展非空
- 下一步非空

### 8.3 软限制

| 内容 | 建议限制 |
|---|---:|
| 项目标题 | 30 个中文字符 |
| 项目摘要 | 150 个中文字符 |
| 单条列表项 | 120 个中文字符 |
| 每栏列表数 | 8 条 |
| 项目数 | 8 个 |

超出软限制时警告，但仍允许生成。

## 9. React 组件设计

```text
DailyReportPage
├── ReportHeader
├── ProjectList
│   └── ProjectCard × N
│       ├── ProjectMeta
│       ├── StatusBadge
│       └── ContentSection × N
├── GlobalNextActions
└── ReportFooter
```

### 9.1 DailyReportPage

- 根节点 ID 固定为 `daily-report`
- 逻辑宽度固定为 1080 px
- 高度自动增长
- 负责整体背景、页面内边距和区块间距
- 不使用绝对定位组织主要内容

### 9.2 ReportHeader

显示：

- OWNER / 作者
- 日期与星期
- 主标题
- 英文副标题
- SVG 装饰折线与几何元素

### 9.3 ProjectCard

显示：

- 项目编号
- 项目标题
- 状态标签
- 项目摘要
- 今日进展
- 当前问题
- 下一步

卡片高度由内容撑开，不设置固定高度，不允许裁切文本。

### 9.4 StatusBadge

状态映射：

| 状态 | 标签 |
|---|---|
| `completed` | `COMPLETED` |
| `in-progress` | `IN PROGRESS` |
| `planned` | `PLANNED` |
| `blocked` | `BLOCKED` |

颜色由 CSS Tokens 控制。

### 9.5 ContentSection

三个项目栏目共用同一个组件，只接收：

```ts
title: string
items: string[]
emptyText?: string
```

### 9.6 GlobalNextActions

显示全局下一步列表。第一版不增加优先级、项目代码或交互。

### 9.7 ReportFooter

显示：

- PERSONAL DAILY REPORT
- 简短说明
- 报告日期
- 版本号
- SVG 装饰元素

## 10. CSS 设计规范

### 10.1 Design Tokens

集中定义：

- 页面宽度
- 页面背景
- 主色和强调色
- 状态颜色
- 字体族
- 字号和行高
- 间距
- 圆角
- 边框
- 阴影

示例：

```css
:root {
  --report-width: 1080px;
  --report-page-padding-x: 72px;
  --report-page-padding-y: 72px;
  --report-section-gap: 28px;

  --color-page-bg: #f2f3f5;
  --color-card-bg: #ffffff;
  --color-primary: #16588f;
  --color-primary-dark: #0f4776;
  --color-accent: #f4a11a;

  --color-text-main: #16324a;
  --color-text-secondary: #667788;
  --color-border: #dce4eb;

  --radius-card: 10px;
  --radius-header: 16px;
  --radius-badge: 999px;
}
```

正式数值以 Figma 属性面板和视觉对比结果为准。

### 10.2 Figma 到 CSS 的映射

| Figma | CSS |
|---|---|
| Vertical Auto Layout | `display:flex; flex-direction:column` |
| Horizontal Auto Layout | `display:flex; flex-direction:row` |
| Item spacing | `gap` |
| Padding | `padding` |
| Fill container | `width:100%` / `flex:1` |
| Hug contents | `height:auto` / `fit-content` |
| Fixed width | 固定 `width` |
| Corner radius | `border-radius` |
| Stroke | `border` |
| Drop shadow | `box-shadow` |

### 10.3 文本规则

- 中文和英文允许自动换行
- 使用 `overflow-wrap: anywhere`
- 不设置固定文本高度
- 不使用 `overflow: hidden` 裁切正文
- 使用固定字体文件时等待字体加载完成后截图

## 11. 单张长图布局

```css
.report-page {
  box-sizing: border-box;
  width: 1080px;
  min-height: 1920px;
  height: auto;
  overflow-wrap: anywhere;
}
```

规则：

- 固定 1080 px 逻辑宽度
- 最小高度 1920 px
- 内容增加时页面整体增高
- 项目卡片纵向堆叠
- 卡片之间使用固定 `gap`
- 主体布局不使用绝对定位
- 装饰元素只能在自身容器内绝对定位
- 不分页、不缩小字体、不裁切

高度阈值：

| 高度 | 行为 |
|---|---|
| ≤ 10,000 px | 正常生成 |
| 10,000–16,000 px | 警告后继续 |
| > 16,000 px | 默认停止 |

## 12. 本地渲染服务

CLI 启动临时本地 HTTP 服务：

```text
http://127.0.0.1:<random-port>/render
```

只监听 `127.0.0.1`。

React 页面从临时目录读取标准化的 `report-data.json`，完成渲染后设置：

```html
<body data-render-status="ready">
```

## 13. Playwright 导出

浏览器配置：

- Playwright Chromium
- Headless 模式
- Locale：`zh-CN`
- Viewport：`1080 × 1000`
- Media：`screen`
- 动画禁用
- 光标隐藏
- `deviceScaleFactor` 由 `--scale` 控制

导出前等待：

1. 页面 DOM 加载完成
2. `document.fonts.ready`
3. 图片和 SVG 资源完成
4. `data-render-status="ready"`
5. 根节点高度连续多次稳定

### 13.1 PNG

截取：

```text
#daily-report
```

默认：

```text
1080 × 实际高度
```

`--scale 2` 时：

```text
2160 × 实际高度的两倍
```

CSS 逻辑宽度和文字换行不变。

### 13.2 PDF

使用自定义长页面：

```ts
await page.pdf({
  width: "1080px",
  height: `${reportHeight}px`,
  printBackground: true,
  margin: {
    top: "0",
    right: "0",
    bottom: "0",
    left: "0"
  }
});
```

规则：

- 不使用 A4
- 不分页
- 不增加默认页边距
- 保留背景颜色
- 与 PNG 使用相同屏幕样式

## 14. 布局检查

导出前检查：

- 根节点存在
- 根节点宽度为 1080 px
- 高度大于 0
- `scrollWidth === clientWidth`
- 页面不存在横向滚动
- 关键文本元素不存在裁切
- 所有字体加载成功
- 所有资源加载成功

检查失败时不写入正式输出。

## 15. CLI 设计

```bash
daily-report <markdown-file> [options]
```

支持参数：

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `<markdown-file>` | 必填 | Markdown 文件 |
| `--scale <1\|2>` | `1` | PNG 输出倍率 |
| `--open` | 关闭 | 成功后打开输出目录 |
| `--dry-run` | 关闭 | 只解析和校验 |
| `--force` | 关闭 | 强制重新生成或覆盖异常旧输出 |
| `--verbose` | 关闭 | 输出详细日志 |

第一版固定同时生成 PNG 和 PDF。

## 16. 输出与原子写入

正式目录：

```text
reports/rendered/YYYY/MM/YYYY-MM-DD/
```

先写入：

```text
.daily-report-cache/run-<timestamp>/
```

完整流程：

```text
生成 report-data.json
→ 导出 PNG
→ 导出 PDF
→ 校验输出非空
→ 生成 report.json
→ 生成 manifest.json
→ 原子替换正式目录
```

任何步骤失败：

- 保留旧输出
- 删除本次临时产物
- CLI 返回非零退出码

## 17. manifest.json

```json
{
  "source": "reports/source/2026/08/2026-08-01.md",
  "sourceHash": "sha256:...",
  "reportDate": "2026-08-01",
  "template": {
    "name": "personal-daily-report",
    "version": "1.0.0"
  },
  "generatorVersion": "0.1.0",
  "generatedAt": "2026-08-01T16:04:00+08:00",
  "render": {
    "cssWidth": 1080,
    "cssHeight": 4368,
    "scale": 1,
    "pngWidth": 1080,
    "pngHeight": 4368
  },
  "outputs": {
    "png": "report.png",
    "pdf": "report.pdf",
    "json": "report.json"
  }
}
```

## 18. 缓存

每次生成计算：

- Markdown 文件 SHA-256
- 模板版本
- 生成器版本

若三者一致且全部输出存在，则跳过重复生成。

`--force` 用于强制重新渲染。

## 19. 错误处理

错误信息必须尽可能包含：

- 错误阶段
- 项目名称或项目编号
- Markdown 行号
- 输入文件路径
- 修复提示

示例：

```text
Error: 项目 PRJ-HC 缺少“### 下一步”栏目。

File:
  reports/source/2026/08/2026-08-01.md

Location:
  line 34
```

结构错误、资源错误和导出错误均不得生成不完整成品。

## 20. 测试体系

### 20.1 Parser 测试

覆盖：

- 正常单项目
- 正常多项目
- 空问题标准化
- 缺少日期
- 缺少状态
- 重复项目编号
- 错误栏目名称
- 文件名日期不一致

### 20.2 Schema 测试

覆盖：

- 日期格式错误
- 空标题或作者
- 项目数组为空
- 项目编号格式错误
- 未知状态
- 今日进展为空
- 下一步为空
- 全局下一步为空

### 20.3 React 组件测试

检查：

- StatusBadge 映射
- ProjectCard 各栏目
- 空问题占位语
- 项目顺序
- Header 和 Footer 数据
- 根节点 ID

### 20.4 Playwright E2E

检查：

- 页面就绪
- 字体完成
- 1080 px 根节点宽度
- 无横向滚动
- PNG/PDF 存在且非空
- manifest 数据正确
- 输出目录正确

### 20.5 视觉回归

固定：

```text
tests/fixtures/visual-reference.md
```

保存：

```text
template-reference/figma-reference.png
tests/visual/baselines/daily-report-standard.png
```

测试时生成当前图和差异图。

建议初始差异容差：

```text
差异像素比例 ≤ 0.5%
```

## 21. 测试内容矩阵

至少包含：

1. **标准内容**：3 个项目，普通长度。
2. **最短内容**：1 个项目，每栏 1 条。
3. **超长内容**：8 个项目、长标题、长英文字符串、多列表。
4. **状态覆盖**：四种状态同时出现。

## 22. 实施阶段

### 阶段 1：项目骨架

- Node.js
- TypeScript
- React
- Vite
- Playwright
- 测试框架
- 基础目录

验收：React 页面可启动，Playwright 可导出测试 PNG。

### 阶段 2：Parser 和 Schema

- Front Matter
- 项目区块
- 固定栏目
- Zod 校验
- 错误行号
- 单元测试

验收：`--dry-run` 能输出标准 JSON 和清晰错误。

### 阶段 3：React 模板

- 所有页面组件
- CSS Tokens
- 1080 px 页面
- 自动高度

验收：固定 JSON 能在浏览器中正确显示。

### 阶段 4：Figma 视觉复刻

- 读取尺寸、颜色、字体和间距
- 导出 SVG 装饰素材
- 建立设计规范
- 视觉对比
- 生成基准图

验收：React 输出与 Figma 参考图无明显结构和样式差异。

### 阶段 5：PNG/PDF 导出

- 临时本地服务
- 页面就绪
- 字体和资源等待
- 布局检查
- PNG/PDF
- manifest
- 原子写入

验收：一条命令生成四个完整输出。

### 阶段 6：稳定性与体验

- 视觉回归
- 异常输入
- 超长内容
- 缓存
- CLI 参数
- README

验收：全部测试通过，重复执行稳定。

## 23. 第一版验收标准

第一版完成必须满足：

- 固定 Markdown 能正确解析
- 多项目数据顺序正确
- 结构错误能定位到项目和行号
- 1080 px 固定宽度
- 页面高度自动增长
- 不存在横向溢出
- 四种状态样式完整
- PNG 和单页长 PDF 均成功生成
- 输出目录按日期组织
- `report.json` 与输入一致
- `manifest.json` 完整
- 字体和资源未完成时不截图
- 导出失败时不覆盖旧输出
- Parser、Schema、组件、E2E 和视觉测试通过
- 最终操作保持为一条命令

## 24. 待用户确认

请确认以下设计决策是否保持不变：

- 代码模板为正式生产模板
- Figma 只作为视觉参考
- 第一版使用本地 CLI
- 第一版只有一个固定模板
- 输入 Markdown 结构固定
- 输出为单张长 PNG 和单页长 PDF
- 页面逻辑宽度固定为 1080 px
- 第一版不接 GitHub 自动化
