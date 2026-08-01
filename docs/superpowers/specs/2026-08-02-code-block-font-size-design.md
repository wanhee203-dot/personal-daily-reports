# 代码块字号调整设计

- 日期：2026-08-02
- 状态：用户已确认
- 基础分支：`codex/daily-report-generator`

## 目标

提高长海报 PDF 中围栏代码块的英文可读性，使其字号与正文一致。

## 方案

仅修改 `src/template/styles/poster.css` 中 `.poster-content pre` 的 `font-size`：

- 从 `14px` 调整为 `16px`；
- 保持现有配色、内边距、换行规则和行高；
- 不影响正文、标题、行内代码、PDF 尺寸逻辑或输出路径。

## 验证

更新视觉快照并运行组件测试、端到端视觉测试和 TypeScript/Vite 构建，确认代码块不发生裁切且整体海报仍可生成。
