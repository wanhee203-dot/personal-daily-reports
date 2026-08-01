import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyReportPage } from "../../src/template/DailyReportPage";

describe("DailyReportPage", () => {
  it("exposes the fixed report root", () => {
    render(<DailyReportPage />);
    const root = screen.getByTestId("daily-report");
    expect(root).toHaveAttribute("id", "daily-report");
  });
});
