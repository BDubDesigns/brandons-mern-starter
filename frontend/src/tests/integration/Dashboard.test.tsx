import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider } from "../../context/AuthProvider";
import { Dashboard } from "../../pages/Dashboard";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";

// Wraps Dashboard in the same way App.tsx does — ProtectedRoute guards the route,
// AuthProvider supplies auth state, and MemoryRouter controls navigation.
const renderDashboard = () => {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Dashboard page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("displays user name and email when authenticated", async () => {
    // Seed a token so AuthProvider fetches the current user from GET /api/auth/me
    // MSW default handler returns { user: { name: "Test User", email: "test@example.com" } }
    localStorage.setItem("token", "fake-token");
    renderDashboard();

    // Wait for the async getCurrentUser() call to resolve and user data to appear
    expect(await screen.findByText(/Welcome, Test User/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/your email: test@example\.com/i),
    ).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", async () => {
    // No token in localStorage — ProtectedRoute should navigate to /login
    renderDashboard();

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("navigates to /login after clicking logout", async () => {
    localStorage.setItem("token", "fake-token");
    renderDashboard();

    // Wait for the dashboard to fully load before interacting with it
    await screen.findByText(/Welcome, Test User/i);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /logout/i }));

    // After logout, token is cleared and ProtectedRoute redirects to /login
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });
});
