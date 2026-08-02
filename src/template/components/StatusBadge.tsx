import type { ProjectStatus } from "../../schema/report-types";

const config: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "COMPLETED",
    className: "status--completed"
  },
  "in-progress": {
    label: "IN PROGRESS",
    className: "status--in-progress"
  },
  planned: {
    label: "PLANNED",
    className: "status--planned"
  },
  blocked: {
    label: "BLOCKED",
    className: "status--blocked"
  }
};

export function StatusBadge({
  status
}: {
  status: ProjectStatus;
}): React.JSX.Element {
  const value = config[status];

  return (
    <span className={`status-badge ${value.className}`}>
      {value.label}
    </span>
  );
}
