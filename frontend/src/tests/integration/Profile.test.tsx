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
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Profile page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders user name in subtitle and current email when authenticated", async () => {
    localStorage.setItem("token", "fake-token");
    renderProfile();

    // MSW /api/auth/me returns { name: "Test User", email: "test@example.com" }
    expect(await screen.findByText(/Test User's Profile/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Current Email: test@example\.com/i),
    ).toBeInTheDocument();
  });

  it("shows success message after successful password update", async () => {
    localStorage.setItem("token", "fake-token");
    renderProfile();
    await screen.findByText(/Test User's Profile/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Current Password", { selector: "input" }),
      "OldPassword1!",
    );
    await user.type(
      screen.getByLabelText("New Password", { selector: "input" }),
      "NewPassword1!",
    );
    await user.type(
      screen.getByLabelText("Confirm New Password", { selector: "input" }),
      "NewPassword1!",
    );
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("Password updated successfully!"),
    ).toBeInTheDocument();
  });

  it("shows error when new passwords do not match (client-side validation)", async () => {
    // No server.use() needed — validation runs before the API call
    localStorage.setItem("token", "fake-token");
    renderProfile();
    await screen.findByText(/Test User's Profile/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Current Password", { selector: "input" }),
      "OldPassword1!",
    );
    await user.type(
      screen.getByLabelText("New Password", { selector: "input" }),
      "NewPassword1!",
    );
    await user.type(
      screen.getByLabelText("Confirm New Password", { selector: "input" }),
      "DifferentPassword1!",
    );
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("New passwords do not match"),
    ).toBeInTheDocument();
  });

  it("shows error message on failed password update", async () => {
    server.use(
      http.patch("http://localhost:5000/api/auth/update-password", () => {
        return HttpResponse.json(
          { message: "Incorrect current password" },
          { status: 400 },
        );
      }),
    );

    localStorage.setItem("token", "fake-token");
    renderProfile();
    await screen.findByText(/Test User's Profile/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Current Password", { selector: "input" }),
      "WrongPassword1!",
    );
    await user.type(
      screen.getByLabelText("New Password", { selector: "input" }),
      "NewPassword1!",
    );
    await user.type(
      screen.getByLabelText("Confirm New Password", { selector: "input" }),
      "NewPassword1!",
    );
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("Incorrect current password"),
    ).toBeInTheDocument();
  });

  it("shows success message after successful email update", async () => {
    localStorage.setItem("token", "fake-token");
    renderProfile();
    await screen.findByText(/Test User's Profile/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("New Email", { selector: "input" }),
      "new@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { selector: "input" }),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: /update email/i }));

    expect(
      await screen.findByText("Email updated successfully!"),
    ).toBeInTheDocument();
  });

  it("shows error message on failed email update", async () => {
    server.use(
      http.patch("http://localhost:5000/api/auth/update-email", () => {
        return HttpResponse.json(
          { message: "Incorrect password" },
          { status: 400 },
        );
      }),
    );

    localStorage.setItem("token", "fake-token");
    renderProfile();
    await screen.findByText(/Test User's Profile/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("New Email", { selector: "input" }),
      "new@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { selector: "input" }),
      "WrongPassword1!",
    );
    await user.click(screen.getByRole("button", { name: /update email/i }));

    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
  });
});
