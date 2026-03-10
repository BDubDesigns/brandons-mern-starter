var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    render(_jsx(MemoryRouter, { initialEntries: ["/dashboard"], children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/login", element: _jsx("div", { children: "Login Page" }) })] }) }) }));
};
describe("Dashboard page", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("displays user name and email when authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        // Seed a token so AuthProvider fetches the current user from GET /api/auth/me
        // MSW default handler returns { user: { name: "Test User", email: "test@example.com" } }
        localStorage.setItem("token", "fake-token");
        renderDashboard();
        // Wait for the async getCurrentUser() call to resolve and user data to appear
        expect(yield screen.findByText(/Welcome, Test User/i)).toBeInTheDocument();
        expect(yield screen.findByText(/your email: test@example\.com/i)).toBeInTheDocument();
    }));
    it("redirects to /login when not authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        // No token in localStorage — ProtectedRoute should navigate to /login
        renderDashboard();
        expect(yield screen.findByText("Login Page")).toBeInTheDocument();
    }));
    it("navigates to /login after clicking logout", () => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.setItem("token", "fake-token");
        renderDashboard();
        // Wait for the dashboard to fully load before interacting with it
        yield screen.findByText(/Welcome, Test User/i);
        const user = userEvent.setup();
        yield user.click(screen.getByRole("button", { name: /logout/i }));
        // After logout, token is cleared and ProtectedRoute redirects to /login
        expect(yield screen.findByText("Login Page")).toBeInTheDocument();
    }));
});
