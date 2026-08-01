import type { ReportMeta } from "../../schema/report-types";

export function ReportFooter({
  meta
}: {
  meta: ReportMeta;
}): React.JSX.Element {
  return (
    <footer className="report-footer">
      <div>
        <strong>PERSONAL DAILY REPORT</strong>
        <p>Research progress, engineering work and next actions.</p>
      </div>
      <div className="report-footer__meta">
        <time dateTime={meta.date}>{meta.date}</time>
        <span>{meta.version ?? "V1"}</span>
      </div>
    </footer>
  );
}
