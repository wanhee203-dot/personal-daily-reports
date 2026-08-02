import type React from "react";

const TOKEN =
  /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

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

export function renderInlineMarkdown(
  text: string
): React.ReactNode[] {
  return text
    .split(TOKEN)
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith("`") && token.endsWith("`")) {
        return <code key={index}>{token.slice(1, -1)}</code>;
      }

      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={index}>{token.slice(2, -2)}</strong>
        );
      }

      if (token.startsWith("*") && token.endsWith("*")) {
        return <em key={index}>{token.slice(1, -1)}</em>;
      }

      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const href = safeHref(link[2]);
        return href ? (
          <a key={index} href={href}>
            {link[1]}
          </a>
        ) : (
          <span key={index}>{token}</span>
        );
      }

      return token;
    });
}

export function InlineMarkdown({
  text
}: {
  text: string;
}): React.JSX.Element {
  return <>{renderInlineMarkdown(text)}</>;
}
