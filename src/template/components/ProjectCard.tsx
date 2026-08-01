import type { ReportProject } from "../../schema/report-types";
import { ContentSection } from "./ContentSection";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({
  project
}: {
  project: ReportProject;
}): React.JSX.Element {
  return (
    <article className="project-card" data-project-code={project.code}>
      <div className="project-card__header">
        <div className="project-card__identity">
          <span className="project-code">{project.code}</span>
          <h2>{project.title}</h2>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="project-summary">{project.summary}</p>

      <div className="project-sections">
        <ContentSection title="今日进展" items={project.progress} />
        <ContentSection
          title="当前问题"
          items={project.issues}
          emptyText="暂无待解决问题"
        />
        <ContentSection title="下一步" items={project.next} />
      </div>
    </article>
  );
}
