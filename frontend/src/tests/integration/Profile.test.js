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
import { Profile } from "../../pages/Profile";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
const renderProfile = () => {
    render(_jsx(MemoryRouter, { initialEntries: ["/profile"], children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/login", element: _jsx("div", { children: "Login Page" }) })] }) }) }));
};
describe("Profile page", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("renders user name in subtitle and current email when authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.setItem("token", "fake-token");
        renderProfile();
        // MSW /api/auth/me returns { name: "Test User", email: "test@example.com" }
        expect(yield screen.findByText(/Test User's Profile/i)).toBeInTheDocument();
        expect(yield screen.findByText(/Current Email: test@example\.com/i)).toBeInTheDocument();
    }));
    it("shows success message after successful password update", () => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.setItem("token", "fake-token");
        renderProfile();
        yield screen.findByText(/Test User's Profile/i);
        const user = userEvent.setup();
        yield user.type(screen.getByLabelText("Current Password", { selector: "input" }), "OldPassword1!");
        yield user.type(screen.getByLabelText("New Password", { selector: "input" }), "NewPassword1!");
        yield user.type(screen.getByLabelText("Confirm New Password", { selector: "input" }), "NewPassword1!");
        yield user.click(screen.getByRole("button", { name: /update password/i }));
        expect(yield screen.findByText("Password updated successfully!")).toBeInTheDocument();
    }));
    it("shows error when new passwords do not match (client-side validation)", () => __awaiter(void 0, void 0, void 0, function* () {
        // No server.use() needed — validation runs before the API call
        localStorage.setItem("token", "fake-token");
        renderProfile();
        yield screen.findByText(/Test User's Profile/i);
        const user = userEvent.setup();
        yield user.type(screen.getByLabelText("Current Password", { selector: "input" }), "OldPassword1!");
        yield user.type(screen.getByLabelText("New Password", { selector: "input" }), "NewPassword1!");
        yield user.type(screen.getByLabelText("Confirm New Password", { selector: "input" }), "DifferentPassword1!");
        yield user.click(screen.getByRole("button", { name: /update password/i }));
        expect(yield screen.findByText("New passwords do not match")).toBeInTheDocument();
    }));
    it("shows error message on failed password update", () => __awaiter(void 0, void 0, void 0, function* () {
        server.use(http.patch("http://localhost:5000/api/auth/update-password", () => {
            return HttpResponse.json({ message: "Incorrect current password" }, { status: 400 });
        }));
        localStorage.setItem("token", "fake-token");
        renderProfile();
        yield screen.findByText(/Test User's Profile/i);
        const user = userEvent.setup();
        yield user.type(screen.getByLabelText("Current Password", { selector: "input" }), "WrongPassword1!");
        yield user.type(screen.getByLabelText("New Password", { selector: "input" }), "NewPassword1!");
        yield user.type(screen.getByLabelText("Confirm New Password", { selector: "input" }), "NewPassword1!");
        yield user.click(screen.getByRole("button", { name: /update password/i }));
        expect(yield screen.findByText("Incorrect current password")).toBeInTheDocument();
    }));
    it("shows success message after successful email update", () => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.setItem("token", "fake-token");
        renderProfile();
        yield screen.findByText(/Test User's Profile/i);
        const user = userEvent.setup();
        yield user.type(screen.getByLabelText("New Email", { selector: "input" }), "new@example.com");
        yield user.type(screen.getByLabelText("Password", { selector: "input" }), "Password1!");
        yield user.click(screen.getByRole("button", { name: /update email/i }));
        expect(yield screen.findByText("Email updated successfully!")).toBeInTheDocument();
    }));
    it("shows error message on failed email update", () => __awaiter(void 0, void 0, void 0, function* () {
        server.use(http.patch("http://localhost:5000/api/auth/update-email", () => {
            return HttpResponse.json({ message: "Incorrect password" }, { status: 400 });
        }));
        localStorage.setItem("token", "fake-token");
        renderProfile();
        yield screen.findByText(/Test User's Profile/i);
        const user = userEvent.setup();
        yield user.type(screen.getByLabelText("New Email", { selector: "input" }), "new@example.com");
        yield user.type(screen.getByLabelText("Password", { selector: "input" }), "WrongPassword1!");
        yield user.click(screen.getByRole("button", { name: /update email/i }));
        expect(yield screen.findByText("Incorrect password")).toBeInTheDocument();
    }));
});
