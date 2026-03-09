import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider } from "../../context/AuthProvider";
import { Register } from "../../pages/Register";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@testing-library/user-event/dist/cjs/setup/index.js";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

const renderRegister = () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Register page", () => {
  // Clear localStorage before each test to ensure a clean state and avoid interference from previous tests
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders name, email, password, confirm password inputs, and submit button", () => {
    renderRegister();
    expect(
      screen.getByLabelText("Name", { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Email", { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Confirm Password", { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /dashboard on successful registration", async () => {
    renderRegister();
    const nameInput = screen.getByLabelText("Name", { selector: "input" });
    const emailInput = screen.getByLabelText("Email", { selector: "input" });
    const passwordInput = screen.getByLabelText("Password", {
      selector: "input",
    });
    const confirmPasswordInput = screen.getByLabelText("Confirm Password", {
      selector: "input",
    });
    const submitButton = screen.getByRole("button", { name: /register/i });

    // Simulate user filling out the form
    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "password123");
    await userEvent.click(submitButton);

    // Assert that the user is redirected to /dashboard
    // We use findByText here because the navigation is asynchronous, and we need to wait for the new content to appear in the DOM
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows error message on failed registration", async () => {
    server.use(
      http.post("http://localhost:5000/api/auth/register", () => {
        return HttpResponse.json(
          { message: "Invalid email or password" },
          { status: 401 },
        );
      }),
    );

    renderRegister();
    const nameInput = screen.getByLabelText("Name", { selector: "input" });
    const emailInput = screen.getByLabelText("Email", { selector: "input" });
    const passwordInput = screen.getByLabelText("Password", {
      selector: "input",
    });
    const confirmPasswordInput = screen.getByLabelText("Confirm Password", {
      selector: "input",
    });
    const submitButton = screen.getByRole("button", { name: /register/i });
    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "wrong@example.com");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.type(confirmPasswordInput, "wrongpassword");
    await userEvent.click(submitButton);

    // Assert that the error message is displayed
    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
  });

  it("shows error message when passwords do not match", async () => {
    renderRegister();
    const nameInput = screen.getByLabelText("Name", { selector: "input" });
    const emailInput = screen.getByLabelText("Email", { selector: "input" });
    const passwordInput = screen.getByLabelText("Password", {
      selector: "input",
    });
    const confirmPasswordInput = screen.getByLabelText("Confirm Password", {
      selector: "input",
    });
    const submitButton = screen.getByRole("button", { name: /register/i });

    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmPasswordInput, "differentpassword");
    await userEvent.click(submitButton);

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
  });
});
