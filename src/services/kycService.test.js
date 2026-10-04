import { saveKYC, deriveStatusFromScore } from "./kycService";
import { postRequest } from "./api";

jest.mock("./api", () => ({
  postRequest: jest.fn(),
  getRequest: jest.fn(),
}));

// jsdom doesn't implement atob's counterpart for arbitrary binary
// data cleanly in older Node test environments — a tiny valid
// base64 PNG header is enough to exercise dataUrlToBlob.
const SAMPLE_SELFIE_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD";

describe("saveKYC", () => {
  beforeEach(() => {
    postRequest.mockReset();
  });

  test("sends a multipart FormData payload including the document and selfie", async () => {
    postRequest.mockResolvedValue({
      status: "Approved",
      faceMatchScore: 92,
      liveness: true,
      ocrData: { name: "Jane Doe", idNumber: "123456789012" },
    });

    const documentFile = new File(["dummy"], "aadhaar.png", {
      type: "image/png",
    });

    const result = await saveKYC({
      govId: "123456789012",
      govIdType: "Aadhaar",
      personalDetails: { fullName: "Jane Doe" },
      email: "jane@example.com",
      mobile: "9876543210",
      documentFile,
      selfie: SAMPLE_SELFIE_DATA_URL,
    });

    expect(postRequest).toHaveBeenCalledTimes(1);

    const [url, formData] = postRequest.mock.calls[0];
    expect(url).toBe("/kyc/submit");
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("govId")).toBe("123456789012");
    expect(formData.get("email")).toBe("jane@example.com");
    expect(formData.get("document")).toBeInstanceOf(File);
    expect(formData.get("selfie")).toBeInstanceOf(Blob);

    expect(result.status).toBe("Approved");
    expect(result.faceMatchScore).toBe(92);
  });

  test("maps a 413 error to a friendly file-size message", async () => {
    postRequest.mockRejectedValue({ status: 413, message: "too big" });

    await expect(
      saveKYC({
        govId: "123456789012",
        govIdType: "Aadhaar",
        personalDetails: { fullName: "Jane Doe" },
        email: "jane@example.com",
        mobile: "9876543210",
        documentFile: null,
        selfie: null,
      })
    ).rejects.toThrow(/too large/i);
  });

  test("maps a 5xx error to a service-unavailable message", async () => {
    postRequest.mockRejectedValue({ status: 503, message: "down" });

    await expect(
      saveKYC({
        govId: "123456789012",
        govIdType: "Aadhaar",
        personalDetails: { fullName: "Jane Doe" },
        email: "jane@example.com",
        mobile: "9876543210",
        documentFile: null,
        selfie: null,
      })
    ).rejects.toThrow(/temporarily unavailable/i);
  });
});

describe("deriveStatusFromScore", () => {
  test("scores above 85 are Approved", () => {
    expect(deriveStatusFromScore(86)).toBe("Approved");
    expect(deriveStatusFromScore(100)).toBe("Approved");
  });

  test("scores from 50 to 85 inclusive are Manual review", () => {
    expect(deriveStatusFromScore(50)).toBe("Manual review");
    expect(deriveStatusFromScore(85)).toBe("Manual review");
    expect(deriveStatusFromScore(70)).toBe("Manual review");
  });

  test("scores below 50 are Rejected", () => {
    expect(deriveStatusFromScore(49)).toBe("Rejected");
    expect(deriveStatusFromScore(0)).toBe("Rejected");
  });

  test("a missing score defaults to Pending", () => {
    expect(deriveStatusFromScore(null)).toBe("Pending");
    expect(deriveStatusFromScore(undefined)).toBe("Pending");
  });
});