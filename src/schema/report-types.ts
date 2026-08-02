export type ProjectStatus =
  | "completed"
  | "in-progress"
  | "planned"
  | "blocked";

export interface ReportMeta {
  title: string;
  date: string;
  owner: string;
  version?: string;
  subtitle?: string;
}

export interface ReportProject {
  code: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  progress: string[];
  issues: string[];
  next: string[];
}

export interface DailyReport {
  meta: ReportMeta;
  projects: ReportProject[];
  globalNextActions: string[];
}
