import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  test.each([
    ["Approved", "Approved"],
    ["Pending", "Pending"],
    ["Rejected", "Rejected"],
    ["Manual review", "Manual Review"],
    ["Completed", "Completed"],
    ["Failed", "Failed"],
    ["Cancelled", "Cancelled"],
  ])("renders the %s status with its mapped label", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test("falls back to the raw status text for an unrecognized value", () => {
    render(<StatusBadge status="Something Else" />);
    expect(screen.getByText("Something Else")).toBeInTheDocument();
  });
});