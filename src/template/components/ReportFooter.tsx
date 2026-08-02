import type { ReportMeta } from "../../schema/report-types";

export function ReportFooter({
  meta
}: {
  meta: ReportMeta;
}): React.JSX.Element {
  return (
    <footer className="report-footer">
      <div>
        <strong data-check-clipping="true">PERSONAL DAILY REPORT</strong>
        <p data-check-clipping="true">
          Research progress, engineering work and next actions.
        </p>
      </div>
      <div className="report-footer__meta">
        <time data-check-clipping="true" dateTime={meta.date}>
          {meta.date}
        </time>
        <span data-check-clipping="true">{meta.version ?? "V1"}</span>
      </div>
    </footer>
  );
}
