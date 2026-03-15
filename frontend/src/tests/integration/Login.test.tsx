import { render } from "@testing-library/react";
import { Login } from "../../pages/Login";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/react", () => ({ SignIn: () => null }));

describe("Login page", () => {
  it("should render the login page", () => {
    const { container } = render(<Login />);
    expect(container).toBeInTheDocument();
  });
});
