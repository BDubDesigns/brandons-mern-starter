import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../../components/ProtectedRoute";

vi.mock("@clerk/react", () => ({
  useAuth: vi.fn(),
  RedirectToSignIn: () => null,
}));

// Import the mocked useAuth function after mocking @clerk/react so we can control its return values in our tests
import { useAuth } from "@clerk/react";

// Helper function to mock useAuth with specific values
const mockAuth = (overrides: Record<string, unknown>) =>
  vi.mocked(useAuth).mockReturnValue(overrides as ReturnType<typeof useAuth>);

const renderProtectedRoute = () =>
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  it("renders Loading... when not loaded", () => {
    mockAuth({ isLoaded: false, isSignedIn: false });
    renderProtectedRoute();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
  it("does not render children when not signed in", () => {
    mockAuth({ isLoaded: true, isSignedIn: false });
    renderProtectedRoute();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
  it("renders children when signed in", () => {
    mockAuth({ isLoaded: true, isSignedIn: true });
    renderProtectedRoute();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
