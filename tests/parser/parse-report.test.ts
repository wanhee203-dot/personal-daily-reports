import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseReportFile,
  parseReportMarkdown
} from "../../src/parser/parse-report";
import { ParseReportError } from "../../src/parser/parse-error";

const fixture = (name: string) =>
  path.resolve("tests", "fixtures", name);

describe("parseReportMarkdown", () => {
  it("parses the fixed report structure", async () => {
    const filePath = fixture("valid-basic.md");
    const source = await readFile(filePath, "utf8");
    const report = parseReportMarkdown(source, filePath);

    expect(report.meta.date).toBe("2026-08-01");
    expect(report.projects).toHaveLength(1);
    expect(report.projects[0]).toMatchObject({
      code: "PRJ-HC",
      status: "in-progress",
      progress: [
        "完成近场密、远场稀的非均匀三角网格。",
        "检查输入文件和边界条件。"
      ]
    });
  });

  it("normalizes 暂无 to an empty issue list", async () => {
    const filePath = fixture("valid-empty-issues.md");
    const source = await readFile(filePath, "utf8");
    const report = parseReportMarkdown(source, filePath);
    expect(report.projects[0].issues).toEqual([]);
  });

  it("reports the project heading line when 下一步 is missing", async () => {
    await expect(
      parseReportFile(fixture("invalid-missing-next.md"))
    ).rejects.toMatchObject({
      name: "ParseReportError",
      line: 9
    });
  });

  it("rejects duplicate codes", async () => {
    await expect(
      parseReportFile(fixture("invalid-duplicate-code.md"))
    ).rejects.toThrow(/duplicate project code/i);
  });

  it("rejects a file-name and Front Matter date mismatch", async () => {
    await expect(
      parseReportFile(fixture("invalid-wrong-date.md"))
    ).rejects.toThrow(/file name date/i);
  });

  it("rejects unsupported free text", () => {
    expect(() =>
      parseReportMarkdown(
        [
          "---",
          "title: 个人日报",
          "date: 2026-08-01",
          "owner: Wenzel",
          "---",
          "",
          "unsupported"
        ].join("\n"),
        "2026-08-01.md"
      )
    ).toThrow(ParseReportError);
  });
});
