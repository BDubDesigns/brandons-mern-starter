import { render } from "@testing-library/react";
import { Profile } from "../../pages/Profile";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/react", () => ({ UserProfile: () => null }));

describe("Profile page", () => {
  it("should render the profile page", () => {
    const { container } = render(<Profile />);
    expect(container).toBeInTheDocument();
  });
});
