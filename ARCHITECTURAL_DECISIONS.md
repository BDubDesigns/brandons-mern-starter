# MERN Starter - Architectural Decisions Log

**Created:** January 10, 2026  
**Purpose:** Document all architectural choices, reasoning, and tradeoffs

---

## 🔐 Authentication & Authorization

### AD-001: Email Verification (REMOVED from Starter)

**Decision:** Do NOT include email verification in the starter template.

**Reasoning:**

- Adds complexity (verification tokens, email service, prune jobs)
- Different projects need different verification flows
- Better to keep starter minimal and add when needed
- DRY principle: Don't repeat verification setup across projects

**Implementation:** When a project needs it, add:

- `verificationToken` and `verificationTokenExpires` fields to User schema
- `EmailController` with token generation and validation
- `/api/auth/verify-email` endpoint
- Frontend `VerifyEmailPage`

**Current Approach:**

- Users register → Immediately get JWT (no email verification)
- `isVerified` field exists in schema but defaults to `true`
- No verification flow in starter

**Related Decisions:**

- Q1: Removed optional verification flag

---

### AD-002: JWT Expiration & Refresh Tokens

**Decision:** Implement industry-standard JWT + Refresh Token mechanism.

**JWT (Access Token):**

- **Lifetime:** 10-15 minutes
- **Storage:** localStorage
- **Purpose:** Short-lived, used for API requests
- **Expires:** Silently, no user notification needed

**Refresh Token:**

- **Lifetime:** 7 days
- **Storage:** HttpOnly cookie (secure, not accessible to JavaScript)
- **Purpose:** Long-lived, used to get new JWT
- **Flow:** When JWT expires, refresh token automatically generates new JWT
- **Expires:** User forced to log in again

**Why 7 days, not 30?**

- Balance between security (shorter = less exposure) and convenience
- 30 days = too long a window for stolen tokens
- 7 days = reasonable "come back within a week" expectation

**Why HttpOnly Cookie for Refresh Token?**

- Immune to XSS attacks (JavaScript cannot access HttpOnly cookies)
- Automatic inclusion in HTTP requests (no manual header setup)
- Industry standard for sensitive tokens
- JWT in localStorage is acceptable because it's short-lived

**Token Expiration Flow:**

```
1. User makes API request with JWT
2. JWT is valid (< 15 min old) → Request succeeds
3. User makes another request after 15 min → JWT expired
4. Backend returns 401 "Token expired"
5. Frontend interceptor catches 401
6. Frontend sends refresh token to /api/auth/refresh
7. Backend validates refresh token
8. If valid → Return new JWT
9. If expired/invalid → Return 403, frontend clears auth, redirects to /login
10. Frontend retries original request with new JWT
```

**User Experience:**

- User never sees "session expired" message (handled silently)
- If refresh token expires → Automatic logout to /login
- Refresh happens automatically, transparent to user

**Related Decisions:**

- Q2: Added JWT + refresh token architecture
- Q2C: Automatic retry of request after refresh (no toast needed on JWT expiry)

---

### AD-003: Silent Token Expiration (No Toast)

**Decision:** When JWT expires, handle silently. No "session expired" UI message.

**Reasoning:**

- Toast messages vary per project (color, text, duration)
- Keeping it out of starter keeps it generic
- If refresh succeeds, user never notices
- If refresh fails, automatic logout to /login is signal enough

**Implementation:**

- Axios interceptor catches 401
- If refresh token valid → Retry request silently
- If refresh token invalid → Logout, redirect to /login (clear visual signal)

**Related Decisions:**

- Q2C: User asked for toast, but clarified that auto-retry makes it unnecessary

---

### AD-004: Password Security & Validation

**Decision:** Enforce strong password requirements in the starter template.

**Requirements:**

- **Minimum length:** 8 characters
- **Must include:**
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 digit (0-9)
  - At least 1 special character (!@#$%^&\*)

**Why Secure-by-Default:**

- User is learning best practices for employment
- Interviews will expect strong password policies
- Easy to relax requirements later if needed
- Hard to add security later

**Implementation:**

```typescript
// express-validator chain in authRoutes
body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/)
  .withMessage(
    "Password must contain uppercase, lowercase, digit, and special character"
  );
```

**Frontend:**

- RegisterPage should show password requirements as user types
- Visual feedback (checkmarks) as requirements are met
- Submit button disabled until all requirements satisfied

**Related Decisions:**

- Q8: Secure-by-default philosophy

---

### AD-005: Email Uniqueness & Case Sensitivity

**Decision:** Email must be unique. Always convert to lowercase.

**Implementation:**

**At Schema Level (MongoDB):**

```typescript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  index: true
}
```

**At Controller Level (on registration & login):**

```typescript
// Always normalize before querying
const normalizedEmail = email.toLowerCase();
const user = await User.findOne({ email: normalizedEmail });
```

**Why Both Levels:**

- Schema enforcement: Database integrity
- Controller normalization: Extra safety layer

**User Enumeration Prevention:**
When a user tries to register with an existing email, return a generic message:

```
"If you don't have an account with this email already, you will receive an email."
```

This DOES NOT say "email already registered" because that reveals which emails are in the system.

**Case Insensitive Login:**

```
User registers: john@example.com (stored as lowercase)
User logs in: JOHN@EXAMPLE.COM → Normalized to lowercase
Works correctly, no "wrong email" errors
```

**Related Decisions:**

- Q14: Email uniqueness at DB level, lowercase enforcement

---

### AD-006: Password Updates (Dedicated Method)

**Decision:** Use dedicated `updatePassword()` method, not generic `findByIdAndUpdate()`.

**Why:**
Pre-save hooks ONLY run on `.save()`, not on `.findByIdAndUpdate()`.

**Problem Example:**

```typescript
// This bypasses pre-save hook!
await User.findByIdAndUpdate(userId, { password: newPassword });
// Password is NOT hashed, stored as plaintext
```

**Solution:**

```typescript
// In User model, add instance method
userSchema.methods.updatePassword = async function (newPassword: string) {
  this.password = newPassword;
  await this.save(); // Triggers pre-save hook
};

// In controller
user.updatePassword(newPassword);
```

**Alternative: Prevent Direct Updates**
Some teams prevent `.findByIdAndUpdate()` on User model entirely, forcing the dedicated method. For this starter, we'll just document the dedicated method approach.

**Related Decisions:**

- Q15: Defensive model design

---

## 🎨 Frontend & Authentication Context

### AD-007: User Hydration on App Load

**Decision:** On app initialization, hit `GET /api/auth/me` endpoint to fetch current user.

**Flow:**

```typescript
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    // Fetch user to verify token is valid and get current user data
    fetchCurrentUser();
  }
}, []);
```

**Why NOT store user in localStorage:**

- ❌ Data mismatch risk (localStorage ≠ DB)
- ❌ User can edit localStorage and fake data
- ❌ Schema changes break old localStorage data
- ❌ No single source of truth

**Why fetch from endpoint:**

- ✅ Backend is single source of truth
- ✅ Real-time user state (deleted, banned, role changed)
- ✅ Schema changes handled by backend
- ✅ Secure validation of JWT

**New Backend Endpoint:**

```
GET /api/auth/me
Authorization: Bearer <JWT>

Response: { user: { _id, name, email, ... } }
Status 401 if token invalid
```

**Frontend Implementation:**

```typescript
async function fetchCurrentUser() {
  try {
    const { data } = await axiosInstance.get("/auth/me");
    setUser(data.user);
    setLoading(false);
  } catch (error) {
    if (error.response?.status === 401) {
      // Try refresh token
      const newJWT = await refreshToken();
      if (newJWT) {
        // Retry fetch with new JWT
        await fetchCurrentUser();
      } else {
        // Refresh failed, logout
        logout();
      }
    }
  }
}
```

**Related Decisions:**

- Q6A: User data source of truth
- Q6B: Handle refresh token expiration

---

### AD-008: Token Refresh on 401 Response

**Decision:** When any API request gets 401, automatically attempt refresh before failing.

**Axios Interceptor Flow:**

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh
      const refreshed = await attemptRefresh();
      if (refreshed) {
        // Retry original request with new token
        return axiosInstance(error.config);
      } else {
        // Refresh failed, logout
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

**Why:**

- Transparent to user
- JWT expiration is expected, handled gracefully
- If refresh also fails, clear signal (logout page)

**Related Decisions:**

- AD-002: JWT + Refresh Token flow
- Q2C: Automatic retry logic

---

### AD-009: Post-Login Redirect (Standard Behavior)

**Decision:** After successful login, redirect to `/dashboard`.

**PrivateRoute Pattern:**

```typescript
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**Future Enhancement (Post-Starter):**
Store intended destination in context:

```typescript
// If user lands on /dashboard/settings without auth
// Redirect to /login?redirect=/dashboard/settings
// After login, redirect to /dashboard/settings (not just /dashboard)
```

**For Starter:** Keep it simple. Always `/dashboard`.

**Related Decisions:**

- Q17: Standard redirect behavior

---

## 📊 Data Validation & Error Handling

### AD-010: Error Middleware Behavior (Dev vs Production)

**Decision:** Different error responses based on NODE_ENV.

**Development (NODE_ENV=development):**

```json
{
  "success": false,
  "message": "Email already in use",
  "details": "User with email john@example.com exists",
  "stack": "at registerUser (authController.ts:45)\n  at POST /api/auth/register (authRoutes.ts:12)"
}
```

**Production (NODE_ENV=production):**

```json
{
  "success": false,
  "message": "Email already in use",
  "statusCode": 400
}
```

**Why:**

- Developers see full context for debugging
- Production hides internal structure (security)
- Mongoose validation errors: Verbose in dev, generic in prod
- Stack traces: Only in dev logs

**Implementation:**

```typescript
export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === "development";

  const response: any = {
    success: false,
    message: err.message,
    statusCode: err.statusCode || 500,
  };

  if (isDev) {
    response.details = err.details;
    response.stack = err.stack;
  }

  res.status(response.statusCode).json(response);
}
```

**Related Decisions:**

- Q3: Environment-aware error handling

---

### AD-011: Race Condition Handling (Duplicate Email Registration)

**Decision:** Catch duplicate key error from MongoDB and return 409 Conflict.

**The Problem:**

```typescript
// Two simultaneous requests with same email
// Both pass findOne check
// Both try to create user
// MongoDB unique index triggers duplicate key error (E11000)
```

**Solution:**

```typescript
try {
  const user = new User({ name, email, password });
  await user.save();
} catch (error: any) {
  if (error.code === 11000) {
    // Duplicate key error
    return res.status(409).json({
      message: "Email already registered",
    });
  }
  throw error;
}
```

**Why 409 Conflict (not 400 Bad Request):**

- 409 = "Resource conflict, request conflicts with current state"
- Correct HTTP semantics for race conditions
- More precise error code for debugging

**Related Decisions:**

- Q18: Concurrency and race conditions

---

### AD-012: Email Rate Limiting (3 Attempts Per Hour)

**Decision:** Allow 3 resend verification email attempts per hour. Block for remainder of hour.

**Implementation (in User Schema):**

```typescript
resendAttempts?: {
  count: number;
  windowStart: Date;
}
```

**Controller Logic:**

```typescript
const now = new Date();
const ONE_HOUR = 60 * 60 * 1000;

if (user.resendAttempts) {
  const timeSinceWindow =
    now.getTime() - user.resendAttempts.windowStart.getTime();

  if (timeSinceWindow < ONE_HOUR) {
    // Within current window
    if (user.resendAttempts.count >= 3) {
      return res.status(429).json({
        message: "Too many attempts. Try again in 1 hour.",
      });
    }
    user.resendAttempts.count++;
  } else {
    // New window
    user.resendAttempts.count = 1;
    user.resendAttempts.windowStart = now;
  }
}

await sendVerificationEmail(email);
await user.save();
```

**Why No Redis:**

- Starter template should minimize dependencies
- MongoDB is already required
- Simple counter + timestamp is sufficient
- Can migrate to Redis later if needed

**Why 3 Attempts:**

- Balances legitimate typos with spam prevention
- If user typos 3 times, they should check their email/contact support
- Prevents email service hammering

**Related Decisions:**

- Q5: Rate limiting strategy

---

## 🧪 Testing Strategy

### AD-013: Email Verification Testing (Mocking in Tests)

**Decision:** Skip actual email sending in tests. Mock Nodemailer.

**Approach:**

```typescript
import { vi } from "vitest";
import * as emailConfig from "../src/config/emailConfig";

beforeAll(() => {
  vi.mock("../src/config/emailConfig", () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  }));
});
```

**Why:**

- Can't click real email links in E2E tests
- Can't actually send to Gmail in tests
- Nodemailer mocking is industry standard
- Tests should be fast and isolated

**In Real Tests:**

```typescript
it("should send verification email on register", async () => {
  const mockSend = vi.spyOn(emailConfig, "sendVerificationEmail");

  // Register user
  // Assert email was called
  expect(mockSend).toHaveBeenCalledWith("test@example.com", expect.any(String));
});
```

**E2E Tests:**

- Skip email verification step or disable it in test mode
- Focus on other user flows

**Related Decisions:**

- Q11: Email testing strategy

---

### AD-014: Backend Test Coverage (5 Core Tests)

**Decision:** Minimum 5 unit tests for auth flow.

**Tests:**

1. ✅ Register new user successfully → User created in DB, JWT returned
2. ✅ Register with duplicate email → 409 Conflict returned
3. ✅ Password hashing works → Plaintext password NOT stored
4. ✅ Login with correct password → JWT returned
5. ✅ Login with wrong password → 401 Unauthorized

**Additional Considerations:**

- ✅ Non-existent email on login → 401 (prevents user enumeration)
- ✅ Case-insensitive email matching → john@x.com = JOHN@X.COM

**Related Decisions:**

- Q10: Edge cases in authentication

---

### AD-015: Frontend Test Coverage (3 Core Tests)

**Decision:** Minimum 3 unit tests for AuthContext.

**Tests:**

1. ✅ AuthContext initializes with null user
2. ✅ Login updates user state and stores token
3. ✅ Logout clears user state and removes token

**Related Decisions:**

- Q19: Error handling in context

---

## 🚀 Deployment & Environment

### AD-016: Environment Variables & Secrets

**Decision:** Use `.env.example` (committed) and `.env` (gitignored).

**Files:**

`.env.example` (committed to Git):

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mern-starter
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

`.env` (NOT committed, in .gitignore):

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://actual_user:actual_pass@...
JWT_SECRET=actual_secret_xyz123...
JWT_REFRESH_SECRET=actual_refresh_secret_...
GMAIL_USER=myemail@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
```

**Why Two Files:**

- `.env.example` shows structure without secrets
- New developers copy `.env.example` → `.env` and fill in values
- No risk of accidentally committing secrets

**Secret Rotation:**

- If secret is committed: Immediately rotate all secrets
- For portfolio project: Less critical, but good practice
- In production: Use secret management service (AWS Secrets Manager, etc.)

**Related Decisions:**

- Q12: Secret management

---

### AD-017: Environment Variable Parsing

**Decision:** Parse env values explicitly. No magic helpers needed.

**For Booleans:**

```typescript
// Correct
const emailEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";

// Wrong (everything is truthy)
if (process.env.ENABLE_EMAIL_VERIFICATION) {
} // "false" is truthy!
```

**For Numbers:**

```typescript
const port = parseInt(process.env.PORT || "5000", 10);
```

**Why No Helper:**

- Learning the gotcha is valuable
- Explicit is better than implicit
- Can add helper later if needed

**Related Decisions:**

- Q13: Environment variable parsing gotchas

---

## 📈 Additional Features (Not in Starter)

### AD-018: User Profile & Bio (Phase 2)

**Flagged for future addition, NOT in starter:**

**New Fields on User Schema:**

- `bio: string` (user's short bio)
- `updatedAt: Date` (when profile was last updated)

**New Endpoints:**

- `GET /api/users/:userId` → Public profile (shows bio, username, NOT email)
- `PUT /api/users/profile` → Update own profile (name, bio, email)
- `PUT /api/users/password` → Update own password

**Related Decisions:**

- Q9: User profile pages

---

### AD-019: Email Change & Verification (Phase 2)

**Flagged for future addition, NOT in starter:**

When user changes email, send verification link to new email before accepting change.

**Related Decisions:**

- Q9: Email update flow

---

### AD-020: Multi-Tab Logout Synchronization (Phase 3+)

**Flagged for future addition, NOT in starter:**

Use `storage` event listener to sync logout across tabs:

```typescript
window.addEventListener("storage", (e) => {
  if (e.key === "token" && !e.newValue) {
    // Token was removed in another tab
    logout();
  }
});
```

**Related Decisions:**

- Q7: Multi-tab concerns (not in scope for starter)

---

### AD-021: Code Splitting & Lazy Loading (Phase 2+)

**Flagged for future addition, NOT in starter:**

Use `React.lazy()` and `<Suspense>` for route-based code splitting.

**Related Decisions:**

- Q16: Performance optimization (keep simple for starter)

---

## 🎨 Additional Decisions (Q7, Q9, Q19)

### AD-022: Cross-Tab Logout Synchronization

**Decision:** Include cross-tab logout sync in starter (10 lines of code, industry standard).

**The Problem:**

- User logs out in Tab 1 → Token cleared from localStorage
- Tab 2 doesn't know about it → Tab 2 still thinks user is logged in
- User clicks something on Tab 2 → Gets 401 → Confused

**The Solution:**
Listen for `storage` event. When localStorage changes in one tab, all other tabs are notified.

**Implementation (in AuthContext):**

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "token" && e.newValue === null) {
      // Token was removed (user logged out in another tab)
      logout();
      window.location.href = "/login";
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

**Why Industry Standard:**

- All production apps with multiple tabs use this
- Common interview question: "How do you handle logout across browser tabs?"
- Your answer: "Using localStorage event listener"

**Related Decisions:**

- Q7: Multi-tab behavior

---

### AD-018: User Profile Updates (Simplified for Starter)

**Decision:** Users can update password and email. Bio and public profiles moved to Phase 2.

**What's IN the starter:**

- ✅ Change password (requires old password for verification)
- ✅ Change email (verify new email isn't already taken)
- ❌ User bio (Phase 2+)
- ❌ Public user profiles / viewing other users (Phase 2+)

**New Backend Endpoints:**

```
GET /api/auth/me                    → Current user profile
PUT /api/users/password             → Update own password
PUT /api/users/email                → Update own email
```

**Frontend:**

- Single `ProfilePage.tsx` component
- Form to change password (old password + new password fields)
- Form to change email
- Display current user info

**Why Simplified:**

- Keeps starter focused on core auth (register, login, profile management)
- Still teaches CRUD operations on User model
- Bio and public profiles are natural Phase 2 extensions
- Reduces initial scope and complexity

**Related Decisions:**

- Q9: User profile pages
- AD-006: updatePassword() method

---

### AD-023: Error Handling in AuthContext

**Decision:** All async operations in AuthContext use try/catch/finally for proper error handling.

**Pattern:**

```typescript
async function login(email: string, password: string) {
  setLoading(true);
  setError(null); // Clear previous errors

  try {
    const { data } = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    // Success path
    localStorage.setItem("token", data.token);
    setUser(data.user);
  } catch (error: any) {
    // Error path - handle different error types
    if (error.response?.status === 401) {
      setError("Invalid email or password");
    } else if (error.response?.status === 429) {
      setError("Too many login attempts. Try again later.");
    } else if (!error.response) {
      // Network error (no connection, timeout, etc.)
      setError("Network error. Check your connection.");
    } else {
      setError(error.response?.data?.message || "Login failed");
    }
  } finally {
    // Always runs (success or failure) - cleanup code
    setLoading(false);
  }
}
```

**Error Object Shape (from Axios):**

```typescript
error.response?.status; // HTTP status code (401, 400, 500, etc.)
error.response?.data; // Backend response body { message: "...", statusCode: 400 }
error.response?.data?.message; // User-friendly error message
error.message; // Generic error message ("Request failed with status code 401")
error.code; // Error code ("ERR_BAD_REQUEST", "ECONNABORTED", etc.)
!error.response; // True if network error (no connection, timeout)
```

**Why This Structure:**

- `try` = code you want to execute
- `catch` = what happens if it fails (detect error type, show user message)
- `finally` = cleanup (always runs, success or failure)
- `setError(null)` at start = clear previous error messages
- `setLoading(false)` in finally = always stop loading spinner

**Related Decisions:**

- Q19: Error handling in context

---

| Question | Decision                                   | Status     |
| -------- | ------------------------------------------ | ---------- |
| Q1       | AD-001: Remove email verification          | ✅ Decided |
| Q2       | AD-002: JWT + Refresh tokens               | ✅ Decided |
| Q2B      | AD-002: 7-day refresh, 15-min JWT          | ✅ Decided |
| Q2C      | AD-003 & AD-008: Silent expiry, auto-retry | ✅ Decided |
| Q3       | AD-010: Dev vs prod error handling         | ✅ Decided |
| Q4       | AD-001: Removed email verification         | ✅ Decided |
| Q5       | AD-012: 3 attempts/hour rate limit         | ✅ Decided |
| Q6A      | AD-007: Fetch user from endpoint           | ✅ Decided |
| Q6B      | AD-008: Refresh on 401                     | ✅ Decided |
| Q7       | AD-022: Cross-tab logout sync in starter    | ✅ Decided |
| Q8       | AD-004: Strong password requirements       | ✅ Decided |
| Q9       | AD-018: Password + email updates in starter| ✅ Decided |
| Q10      | AD-011 + tests                             | ✅ Decided |
| Q11      | AD-013: Mock email in tests                | ✅ Decided |
| Q12      | AD-016: .env.example pattern               | ✅ Decided |
| Q13      | AD-017: Explicit env parsing               | ✅ Decided |
| Q14      | AD-005: Email uniqueness & lowercase       | ✅ Decided |
| Q15      | AD-006: updatePassword() method            | ✅ Decided |
| Q16      | AD-021: Code splitting (Phase 2+)          | 📋 Future  |
| Q17      | AD-009: Standard redirect to /dashboard    | ✅ Decided |
| Q18      | AD-011: Catch E11000 errors                | ✅ Decided |
| Q19      | AD-023: Error handling in AuthContext      | ✅ Decided |
| Q20      | Morgan logging (standard usage)            | ✅ Decided |
| Q21      | Use `.select()` for optimization           | ✅ Decided |

---

## 🎯 What This Means for Your Starter

**These decisions LOCK IN the architecture:**

- Backend must implement refresh token endpoint
- Frontend must handle token refresh automatically
- Email verification is completely removed
- Strong passwords required
- User hydration on app load
- All error responses are environment-aware

**When you code, reference this document** for exact implementation details.

**Next Steps:**

1. Update PROJECT_SPEC.md with these decisions
2. Answer remaining questions (Q7, Q16-Q21 deep dives if needed)
3. Start Phase 1 of implementation
