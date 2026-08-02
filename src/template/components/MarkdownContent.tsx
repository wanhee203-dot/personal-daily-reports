import type { MarkdownBlock } from "../../markdown/document-types";
import { InlineMarkdown } from "./InlineMarkdown";

function MarkdownHeading({
  block
}: {
  block: Extract<MarkdownBlock, { type: "heading" }>;
}): React.JSX.Element {
  if (block.level === 1) {
    return (
      <h1>
        <InlineMarkdown text={block.text} />
      </h1>
    );
  }

  if (block.level === 2) {
    return (
      <h2>
        <InlineMarkdown text={block.text} />
      </h2>
    );
  }

  return (
    <h3>
      <InlineMarkdown text={block.text} />
    </h3>
  );
}

export function MarkdownContent({
  blocks
}: {
  blocks: MarkdownBlock[];
}): React.JSX.Element {
  return (
    <article className="poster-content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          return <MarkdownHeading key={key} block={block} />;
        }

        if (block.type === "paragraph") {
          return (
            <p key={key}>
              <InlineMarkdown text={block.text} />
            </p>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote key={key}>
              <InlineMarkdown text={block.text} />
            </blockquote>
          );
        }

        if (block.type === "code") {
          const isWorkflow = block.language?.toLowerCase() === "text";
          const className = isWorkflow
            ? "poster-code poster-code--workflow"
            : "poster-code";

          return (
            <pre key={key} className={className}>
              {isWorkflow ? (
                <span className="poster-code__label">
                  CORE WORKFLOW
                </span>
              ) : null}
              <code data-language={block.language}>
                {block.code}
              </code>
            </pre>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={key}>
              <img src={block.src} alt={block.alt} />
            </figure>
          );
        }

        const List = block.ordered ? "ol" : "ul";
        return (
          <List key={key}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <InlineMarkdown text={item} />
              </li>
            ))}
          </List>
        );
      })}
    </article>
  );
}
