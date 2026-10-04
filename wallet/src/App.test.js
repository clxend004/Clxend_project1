import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the welcome screen on the default route", () => {
  render(<App />);

  expect(
    screen.getByText(/welcome to your smart digital wallet/i)
  ).toBeInTheDocument();
});

test("renders the VECTRO brand name", () => {
  render(<App />);

  expect(screen.getAllByText(/vectro/i).length).toBeGreaterThan(0);
});