import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Dashboard } from "../../pages/Dashboard";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

vi.mock("@clerk/react", () => ({
  useUser: vi.fn(),
  useClerk: vi.fn(),
}));

import { useUser, useClerk } from "@clerk/react";

const mockSignedInUser = () => {
  vi.mocked(useUser).mockReturnValue({
    isLoaded: true,
    user: {
      fullName: "Test User",
      primaryEmailAddress: { emailAddress: "test@example.com" },
    },
  } as ReturnType<typeof useUser>);
  vi.mocked(useClerk).mockReturnValue({
    signOut: vi.fn(),
  } as unknown as ReturnType<typeof useClerk>);
};

describe("Dashboard page", () => {
  it("displays user name and email when authenticated", () => {
    mockSignedInUser();
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Welcome, Test User/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your email: test@example\.com/i),
    ).toBeInTheDocument();
  });

  it("shows loading state when Clerk is not yet loaded", () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: false,
      user: null,
    } as unknown as ReturnType<typeof useUser>);
    vi.mocked(useClerk).mockReturnValue({
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useClerk>);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    const signOut = vi.fn();
    mockSignedInUser();
    vi.mocked(useClerk).mockReturnValue({ signOut } as unknown as ReturnType<
      typeof useClerk
    >);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(signOut).toHaveBeenCalledOnce();
  });
});
