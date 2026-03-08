import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../components/Button";
import { describe, it, expect, vi } from "vitest";

describe("Button", () => {
  it("renders children as button text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const user = userEvent.setup();
    // UserEvent simulates the full browser event chain (mousedown → focus → click), unlike .click()
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });
  describe("when loading prop is true", () => {
    it("shows 'Loading...' text", () => {
      render(<Button loading={true}>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Loading...");
    });

    it("is disabled when loading is true", () => {
      render(<Button loading={true}>Click me</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
