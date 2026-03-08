import { render, screen } from "@testing-library/react";
import { Divider } from "../../components/Divider";
import { describe, it, expect } from "vitest";

describe("Divider component", () => {
  it("should render a divider", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
