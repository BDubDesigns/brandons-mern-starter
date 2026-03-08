import { render, screen } from "@testing-library/react";
import { FormInput } from "../../components/FormInput";
import { describe, it, expect } from "vitest";
describe("FormInput", () => {
  describe("when label prop is provided", () => {
    it("renders an input linked to its label via getByLabelText", () => {
      render(<FormInput label="Username" name="username" />);
      const input = screen.getByLabelText("Username");
      expect(input).toBeInTheDocument();
    });
  });
  describe("when label prop is omitted", () => {
    it("renders no label", () => {
      const { container } = render(<FormInput name="username" />);
      expect(container.querySelector("label")).not.toBeInTheDocument();
    });
  });
  describe("when errors prop is provided", () => {
    it("renders error messages", () => {
      const errors = ["Error 1", "Error 2"];
      render(<FormInput label="Username" name="username" errors={errors} />);
      expect(screen.getByText("Error 1")).toBeInTheDocument();
      expect(screen.getByText("Error 2")).toBeInTheDocument();
    });
  });
  describe("when errors prop is undefined", () => {
    it("renders no errors", () => {
      render(<FormInput label="Username" name="username" />);
      const error = screen.queryByRole("list");
      expect(error).not.toBeInTheDocument();
    });
  });
});
