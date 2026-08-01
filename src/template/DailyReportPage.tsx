import type { DailyReport } from "../schema/report-types";
import { GlobalNextActions } from "./components/GlobalNextActions";
import { ProjectCard } from "./components/ProjectCard";
import { ReportFooter } from "./components/ReportFooter";
import { ReportHeader } from "./components/ReportHeader";
import "./styles/tokens.css";
import "./styles/report.css";

export function DailyReportPage({
  report
}: {
  report: DailyReport;
}): React.JSX.Element {
  return (
    <main
      id="daily-report"
      data-testid="daily-report"
      className="report-page"
    >
      <ReportHeader meta={report.meta} />

      <section className="project-list" aria-label="项目日报">
        {report.projects.map((project) => (
          <ProjectCard key={project.code} project={project} />
        ))}
      </section>

      <GlobalNextActions actions={report.globalNextActions} />
      <ReportFooter meta={report.meta} />
    </main>
  );
}
