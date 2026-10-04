import { isPasskeySupported, loginWithPasskey } from "./webauthnService";
import { postRequest } from "./api";

jest.mock("./api", () => ({
  postRequest: jest.fn(),
}));

describe("isPasskeySupported", () => {
  afterEach(() => {
    delete window.PublicKeyCredential;
  });

  test("returns false when PublicKeyCredential doesn't exist", async () => {
    expect(await isPasskeySupported()).toBe(false);
  });

  test("returns true when a platform authenticator is available", async () => {
    window.PublicKeyCredential = function () {};
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      jest.fn().mockResolvedValue(true);

    expect(await isPasskeySupported()).toBe(true);
  });

  test("returns false if the availability check itself throws", async () => {
    window.PublicKeyCredential = function () {};
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      jest.fn().mockRejectedValue(new Error("boom"));

    expect(await isPasskeySupported()).toBe(false);
  });
});

describe("loginWithPasskey error mapping", () => {
  beforeEach(() => {
    postRequest.mockReset();
  });

  test("maps a cancelled/timed-out prompt to a friendly message", async () => {
    postRequest.mockResolvedValueOnce({ challenge: "AAAA" });

    const cancelError = new Error("cancelled");
    cancelError.name = "NotAllowedError";

    navigator.credentials = {
      get: jest.fn().mockRejectedValue(cancelError),
    };

    await expect(loginWithPasskey("jane@example.com")).rejects.toThrow(
      /cancelled or timed out/i
    );
  });

  test("propagates a backend rejection message", async () => {
    postRequest.mockRejectedValueOnce(new Error("No account found"));

    await expect(loginWithPasskey("jane@example.com")).rejects.toThrow(
      /no account found/i
    );
  });
});