import { render, screen, fireEvent } from "@testing-library/react";
import KYCReviewScreen from "./KYCReviewScreen";
import { addSubmissionToReviewQueue } from "../services/kycReviewService";

describe("KYCReviewScreen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("shows an empty state when there are no submissions", () => {
    render(<KYCReviewScreen />);

    expect(screen.getByText(/no submissions here/i)).toBeInTheDocument();
  });

  test("lists a submitted application and lets a reviewer approve it", () => {
    addSubmissionToReviewQueue({
      name: "Jane Doe",
      email: "jane@example.com",
      mobile: "9876543210",
      govIdNumber: "123456789012",
      status: "Pending",
    });

    render(<KYCReviewScreen />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/XXXX XXXX 9012/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: /confirm approve/i }));

    expect(screen.getByText(/marked as approved/i)).toBeInTheDocument();
  });

  test("filters submissions by status", () => {
    addSubmissionToReviewQueue({
      name: "Approved User",
      email: "a@example.com",
      govIdNumber: "111122223333",
      status: "Approved",
    });

    addSubmissionToReviewQueue({
      name: "Pending User",
      email: "p@example.com",
      govIdNumber: "444455556666",
      status: "Pending",
    });

    render(<KYCReviewScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Approved" }));

    expect(screen.getByText("Approved User")).toBeInTheDocument();
    expect(screen.queryByText("Pending User")).not.toBeInTheDocument();
  });
});