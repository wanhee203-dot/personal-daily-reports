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
