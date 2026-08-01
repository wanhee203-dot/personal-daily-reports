import { z } from "zod";
import type { DailyReport } from "./report-types";

const emptyIssueValues = new Set(["暂无", "暂无。", "无", "无。"]);

const nonEmptyText = z.string().trim().min(1);

const reportMetaSchema = z.object({
  title: nonEmptyText,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD"),
  owner: nonEmptyText,
  version: nonEmptyText.optional(),
  subtitle: nonEmptyText.optional()
});

const projectSchema = z.object({
  code: z
    .string()
    .regex(/^[A-Z0-9-]+$/, "code must match ^[A-Z0-9-]+$"),
  title: nonEmptyText,
  status: z.enum(["completed", "in-progress", "planned", "blocked"]),
  summary: nonEmptyText,
  progress: z.array(nonEmptyText).min(1),
  issues: z.array(nonEmptyText).transform((items) => {
    if (items.length === 1 && emptyIssueValues.has(items[0])) {
      return [];
    }
    return items;
  }),
  next: z.array(nonEmptyText).min(1)
});

export const dailyReportSchema = z
  .object({
    meta: reportMetaSchema,
    projects: z.array(projectSchema).min(1),
    globalNextActions: z.array(nonEmptyText).min(1)
  })
  .superRefine((report, context) => {
    const seen = new Set<string>();

    report.projects.forEach((project, index) => {
      if (seen.has(project.code)) {
        context.addIssue({
          code: "custom",
          path: ["projects", index, "code"],
          message: `duplicate project code: ${project.code}`
        });
      }
      seen.add(project.code);
    });
  });

export function validateDailyReport(input: unknown): DailyReport {
  return dailyReportSchema.parse(input) as DailyReport;
}
