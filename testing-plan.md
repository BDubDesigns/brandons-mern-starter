# MERN Starter — Testing Strategy & Implementation Plan

## Table of Contents

1. [Why We Test](#1-why-we-test)
2. [The Testing Pyramid](#2-the-testing-pyramid)
3. [Testing Tools We'll Use](#3-testing-tools-well-use)
4. [Unit Tests — Backend](#4-unit-tests--backend)
5. [Unit Tests — Frontend](#5-unit-tests--frontend)
6. [Integration Tests — Backend API](#6-integration-tests--backend-api)
7. [Integration Tests — Frontend Components](#7-integration-tests--frontend-components)
8. [End-to-End Tests](#8-end-to-end-tests)
9. [What We Do NOT Test](#9-what-we-do-not-test)
10. [Implementation Order](#10-implementation-order)

---

## 1. Why We Test

Testing is not about proving your code works today. It's about **proving it still works tomorrow** — after refactors, new features, and bug fixes. Tests give you the confidence to change code without fear of breaking something silently.

### The Three Reasons

1. **Regression Prevention** — When you add a feature next month, automated tests catch if it accidentally broke login.
2. **Documentation** — A test file describes _what the code should do_ in executable form. New developers (or future you) read tests to understand behavior.
3. **Design Feedback** — Code that's hard to test is usually poorly designed. If you can't test a function in isolation, it's doing too much.

### The Interview Angle

Every serious engineering team expects testing. When an interviewer sees tests in your portfolio project, it signals:

- You ship production-grade code, not prototypes
- You understand software reliability
- You can work on a team where CI/CD pipelines gate deployments on passing tests

---

## 2. The Testing Pyramid

The testing pyramid describes the **ratio** of different test types. More tests at the bottom (fast, cheap), fewer at the top (slow, expensive).

```
        /    E2E   \      ← Few: Slow, brittle, expensive
       /------------\
      / Integration  \    ← Some: Test modules working together
     /----------------\
    /    Unit Tests    \  ← Many: Fast, isolated, cheap
   /--------------------\
```

### Unit Tests

- **What:** Test a single function, utility, or component in complete isolation.
- **Speed:** Milliseconds per test.
- **Example:** Does `createFieldError("email", "Required")` return the correct object shape?
- **Proportion:** ~70% of your tests.

### Integration Tests

- **What:** Test how multiple pieces work together — a route hitting a controller, a component interacting with context.
- **Speed:** Seconds per test (may hit a database or render a component tree).
- **Example:** Does `POST /api/auth/register` with valid data return a 201 with a JWT?
- **Proportion:** ~20% of your tests.

### End-to-End (E2E) Tests

- **What:** Simulate a real user in a real browser clicking through your app.
- **Speed:** Many seconds per test (launches browser, hits real servers).
- **Example:** User opens login page → types credentials → clicks submit → lands on dashboard.
- **Proportion:** ~10% of your tests.

---

## 3. Testing Tools We'll Use

### Backend

| Tool                      | Purpose                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| **Vitest**                | Test runner and assertion library (fast, native ESM support, works with TypeScript out of the box)  |
| **Supertest**             | HTTP assertion library — sends requests to Express app without starting a real server               |
| **mongodb-memory-server** | Spins up an in-memory MongoDB instance for tests — no real database needed, isolated per test suite |

**Why Vitest over Jest?**
Our project uses ESM (`"type": "module"` in package.json) and TypeScript. Jest requires extensive configuration for ESM + TS. Vitest is built for this stack — zero-config, same API as Jest, but native ESM and TypeScript support.

### Frontend

| Tool                            | Purpose                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest**                      | Test runner (same as backend — one tool to learn)                                                                                       |
| **React Testing Library (RTL)** | Renders components and queries them the way a user would (by text, role, label — not by CSS class or component internals)               |
| **jsdom**                       | Simulates a browser DOM in Node.js so components can render without a real browser                                                      |
| **MSW (Mock Service Worker)**   | Intercepts network requests at the service worker level — your Axios calls work normally but hit mock handlers instead of a real server |

### E2E (Later Phase)

| Tool           | Purpose                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **Playwright** | Browser automation — launches real Chrome/Firefox, clicks buttons, fills forms, asserts page content |

---

## 4. Unit Tests — Backend

Unit tests verify that **individual functions** produce the correct output for a given input. They run fast because they don't touch the database or network.

### What to Unit Test

#### `utils/tokenUtils.ts`

These are pure-ish functions (they depend on `process.env.JWT_SECRET` but are otherwise deterministic).

| Function                             | Test Cases                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `generateTokens(userId, email)`      | Returns object with `token` and `refreshToken` properties                             |
|                                      | Both are valid JWT strings (can be decoded)                                           |
|                                      | Payload contains correct `userId` and `email`                                         |
|                                      | Throws error when `JWT_SECRET` is undefined                                           |
| `generateAccessToken(userId, email)` | Returns a single JWT string                                                           |
|                                      | Payload contains correct `userId` and `email`                                         |
|                                      | Token has 15-minute expiration                                                        |
| `formatUserWithoutPassword(user)`    | Returns user object WITHOUT `password` field                                          |
|                                      | Converts `_id` ObjectId to string                                                     |
|                                      | Includes all expected fields: `name`, `email`, `isVerified`, `createdAt`, `updatedAt` |
| `setRefreshTokenCookie(res, token)`  | Calls `res.cookie()` with correct name, value, and options                            |
|                                      | Sets `httpOnly: true`                                                                 |
|                                      | Sets `sameSite: strict`                                                               |

#### `utils/errorFormatter.ts`

| Function                           | Test Cases                                                               |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `createFieldError(field, message)` | Returns `{ type: "field", msg: message, path: field, location: "body" }` |
|                                    | Works with any field name                                                |
|                                    | Works with empty strings (edge case)                                     |

#### `middleware/authMiddleware.ts`

| Function    | Test Cases                                                   |
| ----------- | ------------------------------------------------------------ |
| `verifyJWT` | Calls `next()` when valid token is provided                  |
|             | Sets `req.user` with `userId` and `email` from token payload |
|             | Returns 401 when no Authorization header                     |
|             | Returns 401 when header doesn't start with "Bearer "         |
|             | Returns 401 when token is expired                            |
|             | Returns 401 when token has invalid payload structure         |
|             | Returns 500 when `JWT_SECRET` is undefined                   |

#### `middleware/errorMiddleware.ts`

| Function      | Test Cases                                               |
| ------------- | -------------------------------------------------------- |
| Error handler | Returns 409 for MongoDB duplicate key error (code 11000) |
|               | Returns 400 for Mongoose ValidationError                 |
|               | Returns 401 for JsonWebTokenError                        |
|               | Returns 500 with generic message for unknown errors      |
|               | Includes stack trace only in development mode            |

### How to Write a Backend Unit Test

A unit test follows the **Arrange → Act → Assert** pattern:

```typescript
// Example: testing createFieldError
import { describe, it, expect } from "vitest";
import { createFieldError } from "../utils/errorFormatter";

describe("createFieldError", () => {
  it("should return a properly shaped field error object", () => {
    // Arrange: set up inputs
    const field = "email";
    const message = "Email is required";

    // Act: call the function
    const result = createFieldError(field, message);

    // Assert: verify the output
    expect(result).toEqual({
      type: "field",
      msg: "Email is required",
      path: "email",
      location: "body",
    });
  });
});
```

### Mocking in Unit Tests

When a function has external dependencies (like `process.env` or `jwt.sign`), we **mock** them to isolate the function under test:

```typescript
// Example: testing generateTokens when JWT_SECRET is missing
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("generateTokens", () => {
  beforeEach(() => {
    vi.unstubAllEnvs(); // Clean up env stubs between tests
  });

  it("should throw when JWT_SECRET is undefined", () => {
    vi.stubEnv("JWT_SECRET", ""); // Simulate missing secret

    expect(() => generateTokens("123", "test@example.com")).toThrow(
      "Server configuration error",
    );
  });
});
```

---

## 5. Unit Tests — Frontend

Frontend unit tests verify **utility functions** and **simple component rendering** in isolation.

### What to Unit Test

#### `utils/getFieldErrors.ts`

| Function                        | Test Cases                                                 |
| ------------------------------- | ---------------------------------------------------------- |
| `getFieldErrors(field, errors)` | Returns `undefined` when `errors` is `undefined`           |
|                                 | Returns `undefined` when no errors match the field name    |
|                                 | Returns array of message strings for matching field errors |
|                                 | Filters correctly when multiple fields have errors         |
|                                 | Returns messages only (not full error objects)             |

#### Components — Render Tests

These verify that a component **renders correctly** given specific props, without testing user interaction.

| Component        | Test Cases                                              |
| ---------------- | ------------------------------------------------------- |
| `Button`         | Renders with correct text                               |
|                  | Shows loading state when `loading` prop is true         |
|                  | Applies custom className                                |
|                  | Calls onClick handler when clicked                      |
|                  | Is disabled when loading                                |
| `FormInput`      | Renders label text                                      |
|                  | Renders input with correct type (email, password, text) |
|                  | Displays error messages when `errors` prop is provided  |
|                  | Shows no errors when `errors` is undefined              |
|                  | Calls onChange when user types                          |
| `PageCard`       | Renders title and subtitle                              |
|                  | Renders children content                                |
| `Divider`        | Renders without crashing                                |
| `ProtectedRoute` | Renders children when token exists                      |
|                  | Redirects to /login when no token                       |
|                  | Shows loading state while auth is loading               |

### How to Write a Frontend Unit Test

Frontend tests use React Testing Library to query the DOM the way a user would:

```typescript
// Example: testing FormInput error display
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormInput } from "../components/FormInput";

describe("FormInput", () => {
  it("should display error messages when errors prop is provided", () => {
    // Arrange & Act: render with errors
    render(
      <FormInput
        type="email"
        name="email"
        label="Email"
        errors={["Email is required", "Invalid format"]}
        value=""
        onChange={() => {}}
      />
    );

    // Assert: errors are visible in the DOM
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Invalid format")).toBeInTheDocument();
  });

  it("should render label text", () => {
    render(
      <FormInput
        type="text"
        name="name"
        label="Full Name"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });
});
```

**Key Principle:** Test what the **user sees**, not implementation details. Query by `getByText`, `getByLabelText`, `getByRole` — never by CSS class or component state.

---

## 6. Integration Tests — Backend API

Integration tests verify that **routes, controllers, middleware, and database** work together correctly. We send real HTTP requests to the Express app and assert on the responses.

### Setup: In-Memory Database

Each test suite gets a fresh, isolated MongoDB instance:

```typescript
// test/setup.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  // Clear all collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### What to Integration Test

#### `POST /api/auth/register`

| Scenario                     | Expected                                             |
| ---------------------------- | ---------------------------------------------------- |
| Valid registration data      | 201, returns `{ token, user }`                       |
|                              | User object has `_id`, `name`, `email` (no password) |
|                              | Token is a valid JWT                                 |
|                              | Refresh token is set as httpOnly cookie              |
| Missing name field           | 400, returns field error for "name"                  |
| Missing email field          | 400, returns field error for "email"                 |
| Missing password field       | 400, returns field error for "password"              |
| Weak password (no uppercase) | 400, validation error message                        |
| Duplicate email              | 400, "Email already in use"                          |

#### `POST /api/auth/login`

| Scenario                  | Expected                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| Valid credentials         | 200, returns `{ token, user }`                                   |
|                           | Refresh token cookie is set                                      |
| Wrong password            | 401, "Invalid email or password" (generic)                       |
| Non-existent email        | 401, "Invalid email or password" (same message — no enumeration) |
| Missing email or password | 400, validation errors                                           |

#### `GET /api/auth/me` (Protected)

| Scenario                | Expected                               |
| ----------------------- | -------------------------------------- |
| Valid token             | 200, returns `{ user }` with user data |
| No Authorization header | 401, "Missing or invalid auth header"  |
| Expired token           | 401, "Invalid or expired token"        |
| Malformed token         | 401, "Invalid or expired token"        |

#### `POST /api/auth/refresh`

| Scenario                      | Expected                     |
| ----------------------------- | ---------------------------- |
| Valid refresh token cookie    | 200, returns new `{ token }` |
| No refresh token cookie       | 401, "Unauthorized"          |
| Expired/invalid refresh token | 401, "Invalid refresh token" |

#### `PATCH /api/auth/update-password` (Protected)

| Scenario                                      | Expected                              |
| --------------------------------------------- | ------------------------------------- |
| Correct current password + valid new password | 200, "Password updated successfully"  |
| Wrong current password                        | 400, field error on "currentPassword" |
| Can login with new password after update      | 200 on subsequent login               |

#### `PATCH /api/auth/update-email` (Protected)

| Scenario                           | Expected                              |
| ---------------------------------- | ------------------------------------- |
| Valid new email + correct password | 200, returns new token + updated user |
| Wrong password                     | 400, field error on "password"        |
| Same email as current              | 400, field error on "newEmail"        |
| New token contains updated email   | Decode JWT, verify email claim        |

#### `POST /api/auth/logout` (Protected)

| Scenario           | Expected                             |
| ------------------ | ------------------------------------ |
| Authenticated user | 204, refresh token cookie is cleared |

### How to Write a Backend Integration Test

```typescript
// Example: testing login endpoint
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../server"; // Express app (exported without .listen())

describe("POST /api/auth/login", () => {
  // Register a user before running login tests
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password1!",
    });
  });

  it("should return 200 and a token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password1!" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should return 401 for wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword1!" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });
});
```

### Important: Exporting the Express App

Right now, `server.ts` calls `app.listen()` and `connectDB()` directly. For testing, we need to **export the app without starting it**, so Supertest can control the lifecycle. This requires a small refactor:

```
server.ts    → Creates app, adds middleware/routes, exports app
startServer.ts → Imports app, calls connectDB() + app.listen()
```

This separates the **app definition** from **server startup** — a standard pattern for testable Express apps.

---

## 7. Integration Tests — Frontend Components

Frontend integration tests verify that **components work correctly with context, routing, and user interactions** — but WITHOUT hitting a real backend.

### Setup: Test Wrappers

Components that use `useAuth()` or `useNavigate()` need those providers in tests:

```typescript
// test/helpers/renderWithProviders.tsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../context/AuthProvider";
import { ThemeProvider } from "../context/ThemeProvider";

export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
    options
  );
}
```

### What to Integration Test

#### Login Page

| Scenario                                    | Expected                                      |
| ------------------------------------------- | --------------------------------------------- |
| Renders form with email and password fields | Fields visible, submit button visible         |
| Submitting valid credentials                | Calls login API, redirects to /dashboard      |
| Submitting invalid credentials              | Shows error message from API response         |
| Shows field-level errors                    | Validation errors appear under correct fields |
| Clears errors on mount                      | Previous errors from other pages are cleared  |

#### Register Page

| Scenario                                       | Expected                                    |
| ---------------------------------------------- | ------------------------------------------- |
| Renders form with name, email, password fields | All fields visible                          |
| Submitting valid data                          | Calls register API, redirects to /dashboard |
| Submitting duplicate email                     | Shows "Email already in use" error          |
| Shows password validation errors               | Field errors appear under password field    |

#### Profile/Dashboard

| Scenario                           | Expected                 |
| ---------------------------------- | ------------------------ |
| Shows user data when authenticated | Name and email displayed |
| Redirects when not authenticated   | Navigates to /login      |

### Mocking the API with MSW

Mock Service Worker intercepts requests at the network level, so your Axios client works normally:

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();

    if (body.email === "test@test.com" && body.password === "Password1!") {
      return HttpResponse.json({
        token: "mock-jwt-token",
        user: { _id: "123", name: "Test", email: "test@test.com" },
      });
    }

    return HttpResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }),
];
```

---

## 8. End-to-End Tests

E2E tests simulate a **real user** in a **real browser** against the **running application** (both frontend and backend). They are the most realistic but also the slowest and most brittle.

### What to E2E Test

We only write E2E tests for **critical user journeys** — the paths that, if broken, mean the app is fundamentally unusable:

| Journey               | Steps                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| **Registration Flow** | Open /register → Fill form → Submit → Lands on /dashboard → Sees user name        |
| **Login Flow**        | Open /login → Fill credentials → Submit → Lands on /dashboard                     |
| **Logout Flow**       | On /dashboard → Click logout → Lands on /login → Cannot access /dashboard         |
| **Protected Route**   | Open /dashboard directly without token → Redirected to /login                     |
| **Theme Toggle**      | Click theme toggle → Page switches between light/dark → Persists on refresh       |
| **Update Email**      | On profile → Change email → Submit → New email displayed                          |
| **Update Password**   | On profile → Change password → Logout → Login with new password                   |
| **Token Refresh**     | Login → Wait for token expiry → Make authenticated request → Token auto-refreshes |

### How an E2E Test Looks

```typescript
// Example: Playwright test for login flow
import { test, expect } from "@playwright/test";

test("user can login and reach dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("Password1!");
  await page.getByRole("button", { name: "Login" }).click();

  // Should redirect to dashboard
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

### Why E2E Tests Come Last

1. They require the full app running (frontend + backend + database)
2. They are slow (seconds per test)
3. They are brittle (UI changes break them)
4. They should cover what unit + integration tests cannot: **real browser behavior, cookies, redirects, localStorage**

---

## 9. What We Do NOT Test

Testing everything is a waste of time. These are explicitly **out of scope**:

| What                                             | Why Not                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Third-party libraries (Axios, Express, Mongoose) | They have their own test suites. We test OUR usage of them, not their internals.                              |
| CSS / styling                                    | Visual changes are caught by eyes/design review, not assertions. Use visual regression tools if needed later. |
| TypeScript types                                 | If it compiles, the types are correct. Don't test type annotations.                                           |
| `console.log` calls                              | Logging is a side effect for debugging, not a behavior contract.                                              |
| Trivial components with no logic                 | A component that just renders static JSX with props doesn't need its own test. `Divider` is a good example.   |
| Private implementation details                   | Don't test internal state. Test the **behavior** the user sees.                                               |

---

## 10. Implementation Order

We implement tests in order from **fastest ROI** to **most complex**:

### Phase 1: Setup & Configuration

Install testing dependencies for both frontend and backend. Configure Vitest, set up test scripts in `package.json`, create folder structure.

**Backend:**

```
backend/
  src/
    tests/
      setup.ts              ← In-memory MongoDB lifecycle
      unit/
        errorFormatter.test.ts
        tokenUtils.test.ts
        authMiddleware.test.ts
        errorMiddleware.test.ts
      integration/
        auth.test.ts         ← All auth route tests
```

**Frontend:**

```
frontend/
  src/
    tests/
      setup.ts              ← jsdom + RTL cleanup
      mocks/
        handlers.ts          ← MSW request handlers
        server.ts            ← MSW server instance
      unit/
        getFieldErrors.test.ts
        Button.test.tsx
        FormInput.test.tsx
      integration/
        Login.test.tsx
        Register.test.tsx
```

### Phase 2: Backend Unit Tests

1. `errorFormatter.test.ts` — simplest, pure function, quick win
2. `tokenUtils.test.ts` — tests JWT generation logic
3. `authMiddleware.test.ts` — tests token verification with mocked req/res
4. `errorMiddleware.test.ts` — tests error classification logic

### Phase 3: Backend Integration Tests

5. Refactor `server.ts` to export the app (separate from startup)
6. `auth.test.ts` — test all auth endpoints against in-memory MongoDB

### Phase 4: Frontend Unit Tests

7. `getFieldErrors.test.ts` — pure function, easy
8. `Button.test.tsx` — simple component props/rendering
9. `FormInput.test.tsx` — props + error display

### Phase 5: Frontend Integration Tests

10. Set up MSW mock handlers
11. `Login.test.tsx` — form submission, error display, redirect
12. `Register.test.tsx` — same patterns as Login

### Phase 6: E2E Tests (Optional / Future)

13. Install Playwright
14. Write critical journey tests

---

## Quick Reference: Test Commands

After setup, these are the commands you'll use:

```bash
# Run all backend tests
cd backend && npm test

# Run all frontend tests
cd frontend && npm test

# Run tests in watch mode (re-runs on file save)
cd backend && npm run test:watch

# Run a specific test file
npx vitest run src/tests/unit/tokenUtils.test.ts

# Run with coverage report
npx vitest run --coverage
```

---

**This document is our north star.** We'll reference it as we implement each phase, checking off test cases as we write them. The goal is not 100% coverage — it's **meaningful coverage** of the code paths that matter.
