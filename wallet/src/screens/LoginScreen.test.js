import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginScreen from "./LoginScreen";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginScreen />
    </MemoryRouter>
  );
}

// jsdom has no WebAuthn support, so PublicKeyCredential doesn't
// exist by default — isPasskeySupported() resolves false, which
// is the correct/expected behavior there. Flushing microtasks
// after each render avoids an act() warning from that resolution
// landing after the test body finishes.
const flushPasskeyCheck = () => act(async () => {});

describe("LoginScreen", () => {
  test("renders the email step by default", async () => {
    renderLogin();
    await flushPasskeyCheck();

    expect(screen.getByText(/log in/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/you@example.com/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue" })
    ).toBeInTheDocument();
  });

  test("shows a validation error only after leaving an invalid email field, not while typing", async () => {
    renderLogin();
    await flushPasskeyCheck();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);

    fireEvent.change(emailInput, { target: { value: "john" } });

    // Should NOT show an error while the user is still mid-typing.
    expect(
      screen.queryByText(/enter a valid email address/i)
    ).not.toBeInTheDocument();

    fireEvent.blur(emailInput);

    expect(
      screen.getByText(/enter a valid email address/i)
    ).toBeInTheDocument();
  });

  test("advances to the password step with a valid email", async () => {
    renderLogin();
    await flushPasskeyCheck();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, {
      target: { value: "user@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByPlaceholderText(/enter your password/i)
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  test("suggests email domains while typing an incomplete address", async () => {
    renderLogin();
    await flushPasskeyCheck();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: "john" } });

    expect(screen.getByText("john@gmail.com")).toBeInTheDocument();
  });

  test("switches to the mobile tab and shows a country selector with digit limits", async () => {
    renderLogin();
    await flushPasskeyCheck();

    fireEvent.click(screen.getByRole("tab", { name: /mobile/i }));

    const mobileInput = screen.getByPlaceholderText(/mobile number/i);

    // India (+91) is the default country: 10-digit max.
    fireEvent.change(mobileInput, {
      target: { value: "987654321099" },
    });

    await waitFor(() => {
      expect(mobileInput.value.length).toBe(10);
    });
  });

  test("does not show the passkey button when the device/browser doesn't support WebAuthn", async () => {
    renderLogin();
    await flushPasskeyCheck();

    expect(
      screen.queryByRole("button", { name: /face id \/ passkey/i })
    ).not.toBeInTheDocument();
  });

  test("shows the passkey button when the platform authenticator is available", async () => {
    window.PublicKeyCredential = function () {};
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      jest.fn().mockResolvedValue(true);

    renderLogin();
    await flushPasskeyCheck();

    expect(
      screen.getByRole("button", { name: /face id \/ passkey/i })
    ).toBeInTheDocument();

    delete window.PublicKeyCredential;
  });
});