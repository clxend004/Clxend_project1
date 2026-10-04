import { saveKYC } from "./kycService";
import { postRequest } from "./api";

jest.mock("./api", () => ({
  postRequest: jest.fn(),
  getRequest: jest.fn(),
}));

const SAMPLE_SELFIE_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD";

describe("saveKYC", () => {
  beforeEach(() => {
    postRequest.mockReset();
  });

  test("sends a multipart FormData payload including document, selfie and liveness data", async () => {
    postRequest.mockResolvedValue({
      status: "Approved",
      faceMatchScore: 92,
      liveness: true,
      ocrData: {
        name: "Jane Doe",
        idNumber: "123456789012",
      },
    });

    const documentFile = new File(["dummy"], "aadhaar.png", {
      type: "image/png",
    });

    const result = await saveKYC({
      govId: "123456789012",
      govIdType: "Aadhaar",
      personalDetails: {
        fullName: "Jane Doe",
      },
      email: "jane@example.com",
      mobile: "9876543210",
      documentFile,
      selfie: SAMPLE_SELFIE_DATA_URL,
      livenessPassed: true,
      livenessScore: 95,
      livenessStatus: "Passed",
    });

    expect(postRequest).toHaveBeenCalledTimes(1);

    const [url, formData] = postRequest.mock.calls[0];

    expect(url).toBe("/kyc/submit");
    expect(formData).toBeInstanceOf(FormData);

    expect(formData.get("govId")).toBe("123456789012");
    expect(formData.get("govIdType")).toBe("Aadhaar");
    expect(formData.get("email")).toBe("jane@example.com");
    expect(formData.get("mobile")).toBe("9876543210");

    expect(formData.get("fullName")).toBe("Jane Doe");

    expect(formData.get("livenessPassed")).toBe("true");
    expect(formData.get("livenessScore")).toBe("95");
    expect(formData.get("livenessStatus")).toBe("Passed");

    expect(formData.get("document")).toBeInstanceOf(File);
    expect(formData.get("selfie")).toBeInstanceOf(Blob);

    expect(result.status).toBe("Approved");
    expect(result.faceMatchScore).toBe(92);
  });

  test("rejects submission when liveness verification is not completed", async () => {
    const documentFile = new File(["dummy"], "aadhaar.png", {
      type: "image/png",
    });

    await expect(
      saveKYC({
        govId: "123456789012",
        govIdType: "Aadhaar",
        personalDetails: {
          fullName: "Jane Doe",
        },
        email: "jane@example.com",
        mobile: "9876543210",
        documentFile,
        selfie: SAMPLE_SELFIE_DATA_URL,
        livenessPassed: false,
      })
    ).rejects.toThrow(
      /complete liveness verification/i
    );

    expect(postRequest).not.toHaveBeenCalled();
  });

  test("maps a 413 error to a friendly file-size message", async () => {
    postRequest.mockRejectedValue({
      status: 413,
      message: "too big",
    });

    const documentFile = new File(["dummy"], "aadhaar.png", {
      type: "image/png",
    });

    await expect(
      saveKYC({
        govId: "123456789012",
        govIdType: "Aadhaar",
        personalDetails: {
          fullName: "Jane Doe",
        },
        email: "jane@example.com",
        mobile: "9876543210",
        documentFile,
        selfie: SAMPLE_SELFIE_DATA_URL,
        livenessPassed: true,
        livenessScore: 95,
        livenessStatus: "Passed",
      })
    ).rejects.toThrow(/too large/i);
  });

  test("maps a 5xx error to a service-unavailable message", async () => {
    postRequest.mockRejectedValue({
      status: 503,
      message: "down",
    });

    const documentFile = new File(["dummy"], "aadhaar.png", {
      type: "image/png",
    });

    await expect(
      saveKYC({
        govId: "123456789012",
        govIdType: "Aadhaar",
        personalDetails: {
          fullName: "Jane Doe",
        },
        email: "jane@example.com",
        mobile: "9876543210",
        documentFile,
        selfie: SAMPLE_SELFIE_DATA_URL,
        livenessPassed: true,
        livenessScore: 95,
        livenessStatus: "Passed",
      })
    ).rejects.toThrow(/temporarily unavailable/i);
  });
});
