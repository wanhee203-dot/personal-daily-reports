import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PosterDocument } from "../../src/markdown/document-types";
import { MarkdownPosterPage } from "../../src/template/MarkdownPosterPage";
import { InlineMarkdown } from "../../src/template/components/InlineMarkdown";

const poster: PosterDocument = {
  title: "研究工作日报",
  dateLabel: "2026-07-30—31",
  sourceName: "2026-07-30-31.md",
  blocks: [
    {
      type: "heading",
      level: 2,
      text: "日报生成器"
    },
    {
      type: "paragraph",
      text: "保持 **矢量文字** 和 `清晰代码`。"
    },
    {
      type: "list",
      ordered: false,
      items: ["只生成 PDF"]
    },
    {
      type: "blockquote",
      text: "内容自适应高度。"
    },
    {
      type: "code",
      language: "toml",
      code: 'model_provider = "custom"'
    },
    {
      type: "image",
      alt: "示意图",
      src: "data:image/png;base64,AA=="
    }
  ]
};

describe("MarkdownPosterPage", () => {
  it("renders poster metadata and every Markdown block", () => {
    render(<MarkdownPosterPage document={poster} />);

    expect(screen.getByTestId("daily-report")).toHaveAttribute(
      "id",
      "daily-report"
    );
    expect(
      screen.getByRole("heading", { name: "研究工作日报" })
    ).toBeInTheDocument();
    expect(screen.getByText("2026-07-30—31")).toBeInTheDocument();
    expect(
      screen.getByText('model_provider = "custom"')
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "示意图" }))
      .toHaveAttribute("src", "data:image/png;base64,AA==");
  });

  it("renders safe inline formatting without executing raw HTML", () => {
    const { container } = render(
      <InlineMarkdown
        text={
          "**加粗** `code` [链接](https://example.com) " +
          "<script>alert(1)</script>"
        }
      />
    );

    expect(screen.getByText("加粗").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(screen.getByRole("link", { name: "链接" }))
      .toHaveAttribute("href", "https://example.com");
    expect(container.querySelector("script")).toBeNull();
    expect(
      screen.getByText("<script>alert(1)</script>")
    ).toBeInTheDocument();
  });

  it("keeps unsafe link protocols as readable text", () => {
    const view = render(
      <InlineMarkdown text="[危险链接](javascript:alert(1))" />
    );

    expect(view.container.querySelector("a")).toBeNull();
    expect(view.container).toHaveTextContent(
      "[危险链接](javascript:alert(1))"
    );
  });
});
