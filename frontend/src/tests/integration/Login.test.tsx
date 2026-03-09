import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider } from "../../context/AuthProvider";
import { Login } from "../../pages/Login";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@testing-library/user-event/dist/cjs/setup/index.js";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

const renderLogin = () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Login page", () => {
  // Clear localStorage before each test to ensure a clean state and avoid interference from previous tests
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders email input, password input, and submit button", () => {
    renderLogin();
    expect(
      screen.getByLabelText("Email", { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("navigates to /dashboard on successful login", async () => {
    renderLogin();
    const emailInput = screen.getByLabelText("Email", { selector: "input" });
    const passwordInput = screen.getByLabelText("Password", {
      selector: "input",
    });
    const submitButton = screen.getByRole("button", { name: /login/i });

    // Simulate user filling out the form
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    // Assert that the user is redirected to /dashboard
    // We use findByText here because the navigation is asynchronous, and we need to wait for the new content to appear in the DOM
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows error message on failed login", async () => {
    server.use(
      http.post("http://localhost:5000/api/auth/login", () => {
        return HttpResponse.json(
          { message: "Invalid email or password" },
          { status: 401 },
        );
      }),
    );

    renderLogin();
    const emailInput = screen.getByLabelText("Email", { selector: "input" });
    const passwordInput = screen.getByLabelText("Password", {
      selector: "input",
    });
    const submitButton = screen.getByRole("button", { name: /login/i });
    await userEvent.type(emailInput, "wrong@example.com");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(submitButton);

    // Assert that the error message is displayed
    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
  });
});
