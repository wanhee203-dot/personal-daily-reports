import type { PosterDocument } from "../markdown/document-types";
import { MarkdownContent } from "./components/MarkdownContent";
import "./styles/tokens.css";
import "./styles/poster.css";

export function MarkdownPosterPage({
  document
}: {
  document: PosterDocument;
}): React.JSX.Element {
  return (
    <main
      id="daily-report"
      data-testid="daily-report"
      className="poster-page"
    >
      <header className="poster-header">
        <span className="poster-header__eyebrow">
          PERSONAL DAILY REPORT
        </span>
        <h1>{document.title}</h1>
        <p>{document.dateLabel}</p>
        <svg
          className="poster-header__decoration"
          viewBox="0 0 900 72"
          aria-hidden="true"
        >
          <path d="M0 52 L150 52 L210 20 L330 20 L390 52 L590 52 L650 30 L900 30" />
          <circle cx="210" cy="20" r="7" />
          <circle cx="650" cy="30" r="7" />
        </svg>
      </header>

      <MarkdownContent blocks={document.blocks} />

      <footer className="poster-footer">
        <strong>PERSONAL DAILY REPORT</strong>
        <span>{document.sourceName}</span>
      </footer>
    </main>
  );
}
