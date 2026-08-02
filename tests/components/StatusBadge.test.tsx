import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../../src/template/components/StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["completed", "COMPLETED", "status--completed"],
    ["in-progress", "IN PROGRESS", "status--in-progress"],
    ["planned", "PLANNED", "status--planned"],
    ["blocked", "BLOCKED", "status--blocked"]
  ] as const)("maps %s to its label and class", (status, label, cssClass) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveClass(cssClass);
  });
});
