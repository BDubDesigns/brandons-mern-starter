import { test, expect, Page } from "@playwright/test";
import {
  uniqueEmail,
  TEST_PASSWORD,
  NEW_PASSWORD,
  registerViaApi,
  loginViaApi,
} from "./helpers";

// Each test gets a fresh user and an authenticated browser session
let userEmail: string;

test.beforeEach(async ({ page }) => {
  userEmail = uniqueEmail();
  await registerViaApi(page, "Test User", userEmail, TEST_PASSWORD);
  await loginViaApi(page, userEmail, TEST_PASSWORD);
  await page.goto("/profile");
  // Wait for the profile to fully load before interacting
  await expect(page.getByText(/Test User's Profile/i)).toBeVisible();
});

// ─── Change Password ──────────────────────────────────────────────────────────

test("shows success message after updating password", async ({ page }) => {
  await page.getByLabel("Current Password").fill(TEST_PASSWORD);
  await page.getByLabel("New Password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm New Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /update password/i }).click();

  await expect(page.getByText("Password updated successfully!")).toBeVisible();
});

test("can log in with new password after updating it", async ({ page }) => {
  await page.getByLabel("Current Password").fill(TEST_PASSWORD);
  await page.getByLabel("New Password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm New Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /update password/i }).click();
  await expect(page.getByText("Password updated successfully!")).toBeVisible();

  // Logout and attempt login with the new password
  await page.goto("/dashboard");
  await page
    .getByRole("main")
    .getByRole("button", { name: /logout/i })
    .click();
  await expect(page).toHaveURL("/login");

  await page.getByLabel("Email").fill(userEmail);
  await page.getByLabel("Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page).toHaveURL("/dashboard");
});

test("shows error when new passwords do not match", async ({ page }) => {
  await page.getByLabel("Current Password").fill(TEST_PASSWORD);
  await page.getByLabel("New Password", { exact: true }).fill(NEW_PASSWORD);
  await page
    .getByLabel("Confirm New Password")
    .fill("TotallyDifferentPassword1!");
  await page.getByRole("button", { name: /update password/i }).click();

  await expect(page.getByText("New passwords do not match")).toBeVisible();
});

test("shows error when current password is wrong", async ({ page }) => {
  await page.getByLabel("Current Password").fill("WrongPassword1!");
  await page.getByLabel("New Password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm New Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /update password/i }).click();

  await expect(
    page.getByText(/incorrect.*password|wrong.*password|invalid.*password/i),
  ).toBeVisible();
});

// ─── Change Email ─────────────────────────────────────────────────────────────

test("shows success message after updating email", async ({ page }) => {
  const newEmail = uniqueEmail();

  await page.getByLabel("New Email").fill(newEmail);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /update email/i }).click();

  // Assert the new email appears in the profile — more stable than the transient success message
  // (which disappears when AuthProvider re-fetches getCurrentUser after the token changes)
  await expect(page.getByText(new RegExp(newEmail))).toBeVisible();
});

test("shows error when password is wrong on email update", async ({ page }) => {
  await page.getByLabel("New Email").fill(uniqueEmail());
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword1!");
  await page.getByRole("button", { name: /update email/i }).click();

  // Backend returns a field-level error: "Password is incorrect" under the password input
  await expect(page.getByText("Password is incorrect")).toBeVisible();
});
