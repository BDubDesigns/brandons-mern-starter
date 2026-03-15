import { render } from "@testing-library/react";
import { Register } from "../../pages/Register";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/react", () => ({ SignUp: () => null }));

describe("Register page", () => {
  it("should render the register page", () => {
    const { container } = render(<Register />);
    expect(container).toBeInTheDocument();
  });
});
