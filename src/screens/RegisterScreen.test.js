import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterScreen from "./RegisterScreen";

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <RegisterScreen />
    </MemoryRouter>
  );
}

describe("RegisterScreen", () => {
  test("renders the registration form", () => {
    renderRegister();

    expect(
      screen.getByText(/create your clxend account/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your email/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/create a strong password/i)
    ).toBeInTheDocument();
  });

  test("the Create Account button is disabled until required fields are filled", () => {
    renderRegister();

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    expect(submitButton).toBeDisabled();
  });

  test("suggests email domains while typing", () => {
    renderRegister();

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(emailInput, { target: { value: "jane" } });

    expect(screen.getByText("jane@gmail.com")).toBeInTheDocument();
  });

  test("shows a mismatch error when confirm password differs", () => {
    renderRegister();

    const password = screen.getByPlaceholderText(/create a strong password/i);
    const confirm = screen.getByPlaceholderText(/confirm your password/i);

    fireEvent.change(password, { target: { value: "Str0ng!Pass" } });
    fireEvent.change(confirm, { target: { value: "Different1!" } });
    fireEvent.blur(confirm);

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });
});
