import { Page } from "@playwright/test";

/** Generate a unique email address per test run to avoid database conflicts. */
export function uniqueEmail(): string {
  return `test-${Date.now()}@example.com`;
}

export const TEST_PASSWORD = "Password1!";
export const NEW_PASSWORD = "NewPassword1!";

/**
 * Register a user directly via the API (bypasses UI).
 * Use this in beforeEach to set up authenticated state without re-testing the register form.
 */
export async function registerViaApi(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.request.post("http://localhost:5000/api/auth/register", {
    data: { name, email, password },
  });
}

/**
 * Log in via the API and seed the token into localStorage.
 * Playwright's page.evaluate() runs code inside the browser context, allowing us to set localStorage
 * exactly as the AuthProvider would after a real login.
 */
export async function loginViaApi(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await page.request.post(
    "http://localhost:5000/api/auth/login",
    { data: { email, password } },
  );
  const { token } = await response.json();

  // Navigate to the app first — localStorage is origin-scoped, so the page must be on the right origin
  await page.goto("/");
  await page.evaluate((t) => localStorage.setItem("token", t), token);
}
