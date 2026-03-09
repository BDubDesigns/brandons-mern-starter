import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  TEST_PASSWORD,
  NEW_PASSWORD,
  registerViaApi,
  loginViaApi,
} from "./helpers";

// ─── Registration ────────────────────────────────────────────────────────────

test("user can register and land on /dashboard", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText(/Welcome, Test User/i)).toBeVisible();
});

test("register shows error for duplicate email", async ({ page }) => {
  const email = uniqueEmail();

  // Register once via API to seed the duplicate
  await registerViaApi(page, "Test User", email, TEST_PASSWORD);

  await page.goto("/register");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page.getByText(/email already in use/i)).toBeVisible();
});

// ─── Login ────────────────────────────────────────────────────────────────────

test("user can log in and land on /dashboard", async ({ page }) => {
  const email = uniqueEmail();
  await registerViaApi(page, "Test User", email, TEST_PASSWORD);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText(/Welcome, Test User/i)).toBeVisible();
});

test("login shows error for wrong password", async ({ page }) => {
  const email = uniqueEmail();
  await registerViaApi(page, "Test User", email, TEST_PASSWORD);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("WrongPassword1!");
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test("user can log out and is redirected to /login", async ({ page }) => {
  const email = uniqueEmail();
  await registerViaApi(page, "Test User", email, TEST_PASSWORD);
  await loginViaApi(page, email, TEST_PASSWORD);

  await page.goto("/dashboard");
  await expect(page.getByText(/Welcome, Test User/i)).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("button", { name: /logout/i })
    .click();

  await expect(page).toHaveURL("/login");
});

test("logged-out user cannot access /dashboard and is redirected to /login", async ({
  page,
}) => {
  // Navigate directly with no token in localStorage
  await page.goto("/dashboard");

  await expect(page).toHaveURL("/login");
});
