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
import { Login } from "../../pages/Login";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@testing-library/user-event/dist/cjs/setup/index.js";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
const renderLogin = () => {
    render(_jsx(MemoryRouter, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Login, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx("div", { children: "Dashboard" }) })] }) }) }));
};
describe("Login page", () => {
    // Clear localStorage before each test to ensure a clean state and avoid interference from previous tests
    beforeEach(() => {
        localStorage.clear();
    });
    it("renders email input, password input, and submit button", () => {
        renderLogin();
        expect(screen.getByLabelText("Email", { selector: "input" })).toBeInTheDocument();
        expect(screen.getByLabelText("Password", { selector: "input" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });
    it("navigates to /dashboard on successful login", () => __awaiter(void 0, void 0, void 0, function* () {
        renderLogin();
        const emailInput = screen.getByLabelText("Email", { selector: "input" });
        const passwordInput = screen.getByLabelText("Password", {
            selector: "input",
        });
        const submitButton = screen.getByRole("button", { name: /login/i });
        // Simulate user filling out the form
        yield userEvent.type(emailInput, "test@example.com");
        yield userEvent.type(passwordInput, "password123");
        yield userEvent.click(submitButton);
        // Assert that the user is redirected to /dashboard
        // We use findByText here because the navigation is asynchronous, and we need to wait for the new content to appear in the DOM
        expect(yield screen.findByText("Dashboard")).toBeInTheDocument();
    }));
    it("shows error message on failed login", () => __awaiter(void 0, void 0, void 0, function* () {
        server.use(http.post("http://localhost:5000/api/auth/login", () => {
            return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }));
        renderLogin();
        const emailInput = screen.getByLabelText("Email", { selector: "input" });
        const passwordInput = screen.getByLabelText("Password", {
            selector: "input",
        });
        const submitButton = screen.getByRole("button", { name: /login/i });
        yield userEvent.type(emailInput, "wrong@example.com");
        yield userEvent.type(passwordInput, "wrongpassword");
        yield userEvent.click(submitButton);
        // Assert that the error message is displayed
        expect(yield screen.findByText("Invalid email or password")).toBeInTheDocument();
    }));
});
