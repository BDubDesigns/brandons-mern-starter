import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { AuthContext, AuthContextType } from "../../context/AuthContext";

const mockAuthContext: AuthContextType = {
  user: null,
  token: null,
  loading: false,
  error: null,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  getCurrentUser: vi.fn().mockResolvedValue(undefined),
  updatePassword: vi.fn().mockResolvedValue(undefined),
  updateEmail: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(), // Void return, no mockResolvedValue needed
};

const renderProtectedRoute = (authOverrides: Partial<AuthContextType> = {}) => {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute", () => {
  it("renders 'Loading...' when loading is true", () => {
    renderProtectedRoute({ loading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
  it("renders nothing when loading is false and token is null", () => {
    renderProtectedRoute({ loading: false, token: null });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
  it("renders children when loading is false and token is present", () => {
    renderProtectedRoute({ loading: false, token: "abc" });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
