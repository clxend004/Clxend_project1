import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KYCReviewScreen from "./KYCReviewScreen";
import {
  getReviewQueue,
  updateSubmissionStatus,
} from "../services/kycReviewService";

jest.mock("../services/kycReviewService", () => ({
  getReviewQueue: jest.fn(),
  updateSubmissionStatus: jest.fn(),
}));

describe("KYCReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows an empty state when there are no submissions", async () => {
    getReviewQueue.mockResolvedValue([]);

    render(<KYCReviewScreen />);

    expect(
      await screen.findByText(/no submissions here/i)
    ).toBeInTheDocument();
  });

  test("lists a submitted application and lets a reviewer approve it", async () => {
    getReviewQueue.mockResolvedValue([
      {
        id: 1,
        name: "Jane Doe",
        email: "jane@example.com",
        mobile: "9876543210",
        maskedIdNumber: "XXXX XXXX 9012",
        status: "Pending",
      },
    ]);

    updateSubmissionStatus.mockResolvedValue({
      status: "Approved",
    });

    render(<KYCReviewScreen />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/XXXX XXXX 9012/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    fireEvent.click(
      await screen.findByRole("button", {
        name: /confirm approve/i,
      })
    );

    await waitFor(() => {
      expect(updateSubmissionStatus).toHaveBeenCalledWith(
        1,
        "Approved",
        ""
      );
    });

    expect(
      await screen.findByText(/marked as approved/i)
    ).toBeInTheDocument();
  });

  test("filters submissions by status", async () => {
    getReviewQueue.mockResolvedValue([
      {
        id: 1,
        name: "Approved User",
        email: "a@example.com",
        govIdNumber: "111122223333",
        status: "Approved",
      },
      {
        id: 2,
        name: "Pending User",
        email: "p@example.com",
        govIdNumber: "444455556666",
        status: "Pending",
      },
    ]);

    render(<KYCReviewScreen />);

    expect(
      await screen.findByText("Approved User")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Pending User")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Approved" })
    );

    expect(
      screen.getByText("Approved User")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Pending User")
    ).not.toBeInTheDocument();
  });
});
