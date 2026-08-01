import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDailySource } from "../../src/source/daily-source";

describe("resolveDailySource", () => {
  const root = path.resolve("H:/Workshop/PDR/personal-daily-reports");

  it("maps a zero-padded single day to a numeric output stem", () => {
    const source = path.join(
      root,
      "daily",
      "2026-08",
      "2026-08-01.md"
    );

    expect(resolveDailySource(source, root)).toMatchObject({
      year: "2026",
      month: "08",
      startDay: 1,
      endDay: undefined,
      dateLabel: "2026-08-01",
      outputStem: "1"
    });
  });

  it("maps a same-month day range to the requested numeric range", () => {
    const source = path.join(
      root,
      "daily",
      "2026-07",
      "2026-07-09-11.md"
    );

    expect(resolveDailySource(source, root)).toMatchObject({
      startDay: 9,
      endDay: 11,
      dateLabel: "2026-07-09—11",
      outputStem: "9-11"
    });
  });

  it("accepts February 29 in a leap year", () => {
    const source = path.join(
      root,
      "daily",
      "2028-02",
      "2028-02-29.md"
    );

    expect(resolveDailySource(source, root)).toMatchObject({
      startDay: 29,
      outputStem: "29"
    });
  });

  it("rejects February 29 outside a leap year", () => {
    const source = path.join(
      root,
      "daily",
      "2027-02",
      "2027-02-29.md"
    );

    expect(() => resolveDailySource(source, root)).toThrow(
      /Invalid daily source path/
    );
  });

  it.each([
    "reports/2026-08-01.md",
    "daily/2026-07/2026-08-01.md",
    "daily/2026-02/2026-02-30.md",
    "daily/2026-07/2026-07-11-09.md"
  ])("rejects an invalid daily source path: %s", (relative) => {
    expect(() =>
      resolveDailySource(path.join(root, relative), root)
    ).toThrow(/Invalid daily source path/);
  });
});
