# MERN Starter Template - Project Specification

**Version:** 2.0 (Locked Architectural Decisions)  
**Language:** TypeScript (Full-Stack)  
**Framework Stack:** Express + React + MongoDB + Mongoose  
**Testing:** Vitest (Backend & Frontend) + Cypress (E2E)  
**Created:** January 10, 2026

---

## 📊 Project Overview

This is a **full-stack authentication template** following industry best practices and locked architectural decisions. The goal is to create a reusable starter for personal projects that:

- ✅ User registration (no email verification)
- ✅ Secure login with JWT + Refresh Token
- ✅ Protected routes (frontend + backend)
- ✅ TypeScript throughout
- ✅ Cross-tab logout synchronization
- ✅ Proper error handling (environment-aware)
- ✅ Password + email profile updates
- ✅ Unit tests + E2E tests

This is **NOT** a finished app—it's a DRY foundation. After building this once, you'll use it as a template for all future projects.

---

## 🎯 Core Decisions (Locked In)

See [ARCHITECTURAL_DECISIONS.md](ARCHITECTURAL_DECISIONS.md) for full reasoning. TL;DR:

| Decision                  | What                                            | Why                                                         |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| **No Email Verification** | Users register → Instant access                 | Prevents boilerplate repetition; add per-project            |
| **JWT + Refresh**         | JWT (15 min) + Refresh Token (7 days, HttpOnly) | Balance security (short JWT) vs convenience (7-day refresh) |
| **Silent Token Refresh**  | No toast when JWT expires                       | Seamless UX                                                 |
| **Cross-Tab Logout**      | Storage event listener                          | Industry standard, interview-worthy                         |
| **Strong Passwords**      | 8+ chars, uppercase, lowercase, digit, special  | NIST guidelines                                             |
| **Profile Updates**       | Password + email only (Phase 1)                 | Bio/public profiles → Phase 2+                              |
| **Error Handling**        | try/catch/finally, environment-aware responses  | Proper error codes, no stack traces in prod                 |

---

## 🏗️ Architecture at a Glance

```
Frontend (Vite + React + TS)
    ↓ (HTTPS/API calls via Axios)
Backend (Express + Node + TS)
    ↓ (Queries/Updates via Mongoose)
Database (MongoDB)

Authentication Flow:
User Registration → Instant Access → Login (JWT + Refresh) → Protected Routes → Automatic Refresh on Expiry → Cross-Tab Logout Sync
```

---

## 📁 Backend Specification

### **Folder Structure**

```
backend/
├── src/
│   ├── server.ts                 # Entry point
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection
│   │   └── emailConfig.ts        # Nodemailer setup (Gmail)
│   ├── models/
│   │   └── User.ts               # User schema + methods
│   ├── controllers/
│   │   └── authController.ts     # Register, Login, Refresh, Get Current User
│   ├── routes/
│   │   └── authRoutes.ts         # Route definitions
│   ├── middleware/
│   │   ├── authMiddleware.ts     # Verify JWT, attach user to req
│   │   └── errorMiddleware.ts    # Global error handler
│   ├── types/
│   │   └── index.ts              # Custom TypeScript types
│   └── utils/
│       └── validators.ts         # Input validation helpers
├── tests/
│   └── auth.test.ts              # Unit tests for auth flow
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env
└── .env.example
```

---

### **Entry Point: `backend/src/server.ts`**

**Purpose:** Start the Express server, apply middleware, connect to DB, mount routes.

**Responsibilities:**

1. Initialize Express app
2. Apply middleware (express.json, cors, helmet, morgan)
3. Connect to MongoDB
4. Mount routes
5. Apply error middleware (last)
6. Listen on PORT

**Key Pattern:**

- Middleware order matters: body parsers → cors/helmet → auth/routes → error handler
- Error handler must be LAST
- Use `.listen()` in an async wrapper so you can `await connectDB()`

---

### **Database Connection: `backend/src/config/db.ts`**

**Purpose:** Encapsulate MongoDB connection logic.

**Exports:**

- `connectDB(): Promise<void>` — Connect to MongoDB using `process.env.MONGO_URI`

**Responsibilities:**

1. Call `mongoose.connect()` with connection string
2. Handle success/failure
3. Log status
4. Let errors bubble up (server will fail to start if DB fails)

---

### **Email Configuration: `backend/src/config/emailConfig.ts`**

**Purpose:** Set up Nodemailer for Gmail.

**Exports:**

- `sendVerificationEmail()` — NOT USED (email verification removed)
- `sendPasswordResetEmail()` — For Phase 2+ (prepare structure now)

**Current Status:**

- Email service structure exists
- No emails sent during registration
- Ready for future phases (password reset, notifications)

---

### **User Model: `backend/src/models/User.ts`**

**Schema Fields:**

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string; // Unique, lowercase enforced at schema level
  password: string; // Hashed by pre-save hook
  isVerified: boolean; // Always true (no verification flow)
  createdAt: Date;
  updatedAt: Date;
}
```

**Pre-Save Hook:**

- Hash password if modified (using bcryptjs)
- Set email to lowercase
- Do NOT hash if password unchanged (preserve existing hash)

**Instance Methods:**

- `comparePassword(candidatePassword: string): Promise<boolean>` — Verify password
- `updatePassword(newPassword: string): Promise<void>` — Hash and save new password

**Static Methods:**

- `findByIdWithoutPassword()` — Query helper that excludes password field

**Unique Index:**

- Email must be unique, case-insensitive
- Catch E11000 duplicate key error → Return 409 Conflict

---

### **Auth Controller: `backend/src/controllers/authController.ts`**

**Functions:**

#### **1. `registerUser(req: Request, res: Response)`**

- **Route:** POST `/api/auth/register`
- **Body:** `{ name, email, password }`
- **Validation:**
  - Email is valid format
  - Password meets strength requirements (8+ chars, uppercase, lowercase, digit, special)
  - Email not already taken
- **Process:**
  1. Hash password (via pre-save hook)
  2. Create user in DB
  3. Generate JWT and refresh token
  4. Set refresh token as HttpOnly cookie
  5. Return JWT + user data (no password)
- **Response:** `{ statusCode: 201, token: "jwt...", user: {...}, message: "Registration successful" }`
- **Errors:**
  - 400 (validation failed)
  - 409 (email already exists)
  - 500 (server error)

#### **2. `loginUser(req: Request, res: Response)`**

- **Route:** POST `/api/auth/login`
- **Body:** `{ email, password }`
- **Validation:**
  - Email and password provided
  - Email format valid
- **Process:**
  1. Find user by email
  2. Compare password with bcryptjs
  3. If mismatch → Return 401 (never say "email not found")
  4. Generate JWT and refresh token
  5. Set refresh token as HttpOnly cookie
  6. Return JWT + user data
- **Response:** `{ statusCode: 200, token: "jwt...", user: {...}, message: "Login successful" }`
- **Errors:**
  - 400 (validation failed)
  - 401 (invalid email or password)
  - 500 (server error)
- **Security:** Always return 401 on any auth failure (prevent email enumeration)

#### **3. `refreshToken(req: Request, res: Response)`**

- **Route:** POST `/api/auth/refresh`
- **Request:** Refresh token comes from HttpOnly cookie (automatic)
- **Process:**
  1. Verify refresh token from cookie
  2. If expired/invalid → Return 403 (frontend must logout)
  3. If valid → Generate new JWT + new refresh token
  4. Set new refresh token as HttpOnly cookie
  5. Return new JWT
- **Response:** `{ statusCode: 200, token: "new-jwt..." }`
- **Errors:**
  - 403 (refresh token invalid or expired)
  - 500 (server error)
- **Note:** Frontend calls this when JWT returns 401

#### **4. `getCurrentUser(req: Request, res: Response)`**

- **Route:** GET `/api/auth/me`
- **Auth:** Requires valid JWT (via middleware)
- **Process:**
  1. Middleware already verified JWT and attached user to `req.user`
  2. Fetch full user from DB (to get latest data)
  3. Return user data (no password)
- **Response:** `{ statusCode: 200, user: {...} }`
- **Errors:**
  - 401 (no JWT or invalid)
  - 404 (user not found — shouldn't happen if JWT is valid)
  - 500 (server error)

#### **5. `updatePassword(req: Request, res: Response)`**

- **Route:** PUT `/api/users/password`
- **Auth:** Requires valid JWT
- **Body:** `{ oldPassword, newPassword }`
- **Validation:**
  - New password meets strength requirements
  - Old password matches current password
- **Process:**
  1. Find user by ID (from JWT)
  2. Compare oldPassword with bcryptjs
  3. If mismatch → Return 401
  4. Call user model's `updatePassword(newPassword)` method
  5. Return success
- **Response:** `{ statusCode: 200, message: "Password updated" }`
- **Errors:**
  - 400 (validation failed)
  - 401 (old password incorrect)
  - 500 (server error)

#### **6. `updateEmail(req: Request, res: Response)`**

- **Route:** PUT `/api/users/email`
- **Auth:** Requires valid JWT
- **Body:** `{ newEmail }`
- **Validation:**
  - Email format valid
  - New email not already in use
- **Process:**
  1. Find user by ID (from JWT)
  2. Check if newEmail is unique (catch E11000)
  3. Update email
  4. Return success
- **Response:** `{ statusCode: 200, user: {...}, message: "Email updated" }`
- **Errors:**
  - 400 (validation failed)
  - 409 (email already exists)
  - 500 (server error)

#### **7. `logout(req: Request, res: Response)`**

- **Route:** POST `/api/auth/logout`
- **Purpose:** Clear refresh token cookie
- **Process:**
  1. Clear refresh token cookie (set MaxAge=0)
  2. Frontend will clear localStorage JWT
  3. Both tokens are now gone
- **Response:** `{ statusCode: 200, message: "Logged out" }`

---

### **Auth Routes: `backend/src/routes/authRoutes.ts`**

Routes map endpoints to controller functions:

```
POST   /api/auth/register       → registerUser()
POST   /api/auth/login          → loginUser()
POST   /api/auth/refresh        → refreshToken()
GET    /api/auth/me             → getCurrentUser() [protected]
POST   /api/auth/logout         → logout()
PUT    /api/users/password      → updatePassword() [protected]
PUT    /api/users/email         → updateEmail() [protected]
```

---

### **Auth Middleware: `backend/src/middleware/authMiddleware.ts`**

**Function: `verifyJWT(req: Request, res: Response, next: NextFunction)`**

**Purpose:** Verify JWT token and attach user to request.

**Process:**

1. Extract token from Authorization header (`Bearer <token>`)
2. If missing → Return 401
3. Verify token with `jwt.verify()` using `process.env.JWT_SECRET`
4. If invalid/expired → Return 401
5. If valid → Attach user to `req.user` and call `next()`

**Use:** Wrap protected routes with this middleware.

---

### **Error Middleware: `backend/src/middleware/errorMiddleware.ts`**

**Function: `errorHandler(err: Error, req: Request, res: Response, next: NextFunction)`**

**Purpose:** Catch all errors and return proper JSON responses.

**Process:**

1. Check error type:
   - Mongoose validation error → 400
   - Mongoose E11000 (duplicate key) → 409
   - JWT errors → 401
   - Express validator errors → 400
   - Uncaught errors → 500
2. Determine response:
   - **Development:** Include full error message + stack trace
   - **Production:** Generic message only (no internals leaked)
3. Return JSON response with statusCode, message, (and stack if dev mode)

**Example:**

```typescript
// Production error response
{ statusCode: 500, message: "Server error" }

// Development error response
{ statusCode: 500, message: "Server error", error: "...", stack: "..." }
```

---

### **Environment Variables: `.env`**

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/mern-starter
JWT_SECRET=your-super-secret-jwt-secret-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-token-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## 📁 Frontend Specification

### **Folder Structure**

```
frontend/
├── src/
│   ├── main.tsx                  # Entry point (Vite)
│   ├── App.tsx                   # Router setup
│   ├── index.css                 # Tailwind imports
│   ├── pages/
│   │   ├── HomePage.tsx          # Public landing page
│   │   ├── LoginPage.tsx         # Login form
│   │   ├── RegisterPage.tsx      # Registration form
│   │   ├── DashboardPage.tsx     # Protected dashboard
│   │   └── ProfilePage.tsx       # Protected profile (password + email)
│   ├── components/
│   │   ├── PrivateRoute.tsx      # Route guard component
│   │   └── Header.tsx            # Navigation
│   ├── context/
│   │   └── AuthContext.tsx       # Auth state + functions
│   ├── api/
│   │   └── axios.ts              # Axios instance + interceptors
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── tests/
│       └── AuthContext.test.tsx  # Auth context tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── .env
```

---

### **Main App: `frontend/src/App.tsx`**

**Purpose:** Set up routing and context provider.

**Structure:**

1. Wrap entire app in `BrowserRouter`
2. Wrap BrowserRouter in `AuthProvider` (context)
3. Define routes:
   - Public: HomePage, LoginPage, RegisterPage
   - Protected: DashboardPage, ProfilePage (wrapped in `PrivateRoute`)

**Key Point:** AuthProvider INSIDE BrowserRouter (so routes can use context).

---

### **Axios Setup: `frontend/src/api/axios.ts`**

**Purpose:** Configure HTTP client with automatic token handling + refresh logic.

**Responsibilities:**

1. **Instance Creation:**

   - baseURL: `http://localhost:5000`
   - Headers: `Content-Type: application/json`
   - `withCredentials: true` (allow cookies)

2. **Request Interceptor:**

   - Add JWT from localStorage to Authorization header
   - Send: `Authorization: Bearer <token>`

3. **Response Interceptor:**
   - If response 401 (token expired):
     - Call POST `/api/auth/refresh`
     - If refresh succeeds → Get new JWT, save to localStorage
     - Retry original request with new JWT
     - If refresh fails → Clear localStorage, redirect to /login
   - If other error → Pass through
   - If success → Pass through

**Pattern:**

```typescript
// On 401:
1. Attempt refresh
2. If success: save token, retry
3. If fail: logout, redirect
```

---

### **Auth Context: `frontend/src/context/AuthContext.tsx`**

**Purpose:** Global auth state + functions.

**State:**

- `user: User | null` — Current user or null
- `loading: boolean` — True during async operations
- `error: string | null` — Error message if operation fails

**Functions:**

#### **1. `login(email: string, password: string): Promise<void>`**

- POST `/api/auth/login` with credentials
- On success: Save JWT to localStorage, set user, redirect to /dashboard
- On error: Set error message, stay on login page
- Clear error on retry

#### **2. `register(name: string, email: string, password: string): Promise<void>`**

- POST `/api/auth/register`
- On success: Save JWT, set user, redirect to /dashboard
- On error: Set error message, stay on register page
- Clear error on retry

#### **3. `logout(): void`**

- Clear localStorage JWT
- Set user to null
- Redirect to /
- Optional: POST `/api/auth/logout` (clears refresh cookie server-side)

#### **4. `updatePassword(oldPassword: string, newPassword: string): Promise<void>`**

- PUT `/api/users/password`
- On success: Show success message, clear form
- On error: Set error message

#### **5. `updateEmail(newEmail: string): Promise<void>`**

- PUT `/api/users/email`
- On success: Update user in state, show success
- On error: Set error message

#### **6. `useEffect` (on mount):**

- Check if JWT exists in localStorage
- If yes: Call GET `/api/auth/me` to hydrate user state
- If no: Leave user as null
- This runs on every app load → Keeps user logged in across page refreshes

#### **7. `useEffect` (cross-tab logout):**

- Listen for `storage` event
- If `token` key is removed in another tab → Call logout()
- Redirect to /login
- User is now logged out in all tabs

---

### **Error Handling Pattern (All Context Functions)**

```typescript
async function login(email: string, password: string) {
  setLoading(true);
  setError(null); // Clear previous errors

  try {
    const { data } = await axiosInstance.post("/api/auth/login", {
      email,
      password,
    });

    // Success path
    localStorage.setItem("token", data.token);
    setUser(data.user);
    navigate("/dashboard");
  } catch (error: any) {
    // Error path - handle specific error types
    if (error.response?.status === 401) {
      setError("Invalid email or password");
    } else if (error.response?.status === 400) {
      setError(error.response.data.message || "Invalid input");
    } else if (error.response?.status === 429) {
      setError("Too many attempts. Try again later.");
    } else if (!error.response) {
      // Network error (no connection, timeout)
      setError("Network error. Check your connection.");
    } else {
      setError(error.response?.data?.message || "Operation failed");
    }
  } finally {
    // Always runs - cleanup
    setLoading(false);
  }
}
```

---

### **Private Route Guard: `frontend/src/components/PrivateRoute.tsx`**

**Purpose:** Protect routes that require authentication.

**Logic:**

- Accepts `element` prop (component to render)
- Check if user is logged in (from AuthContext)
- If yes → Render component
- If no → Redirect to /login
- If loading → Show loading spinner or skeleton

---

### **Pages Overview**

#### **HomePage.tsx (Public)**

- Landing page, marketing copy
- Links to Login/Register

#### **LoginPage.tsx (Public)**

- Email + password form
- Calls `login()` from AuthContext
- Shows error if login fails
- Redirects to /dashboard on success

#### **RegisterPage.tsx (Public)**

- Name + email + password + confirm password form
- Validate password strength on client (match server rules)
- Calls `register()` from AuthContext
- Shows error if registration fails
- Redirects to /dashboard on success

#### **DashboardPage.tsx (Protected)**

- Welcome message with user's name
- Button to go to profile
- Button to logout

#### **ProfilePage.tsx (Protected)**

- Display current email
- Form to change password (old + new)
- Form to change email
- Calls `updatePassword()` and `updateEmail()` from context
- Shows success/error messages

---

### **Environment Variables: `.env`**

```
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Testing Specification

### **Backend Tests: `backend/tests/auth.test.ts`**

Test cases (using Vitest):

```
Suite: User Registration
  ✓ Should register a new user with valid data
  ✓ Should hash password with bcryptjs
  ✓ Should prevent duplicate email registration
  ✓ Should return 400 on invalid email format
  ✓ Should return 400 on weak password

Suite: User Login
  ✓ Should login with correct credentials
  ✓ Should return JWT on successful login
  ✓ Should return 401 on wrong password
  ✓ Should return 401 on non-existent email
  ✓ Should never reveal if email exists (both return 401)

Suite: Token Refresh
  ✓ Should refresh JWT with valid refresh token
  ✓ Should return 403 on expired refresh token
  ✓ Should return new JWT on refresh

Suite: Protected Routes
  ✓ Should return 401 on missing JWT
  ✓ Should return 401 on invalid JWT
  ✓ Should allow access with valid JWT
```

---

### **Frontend Tests: `frontend/src/tests/AuthContext.test.tsx`**

Test cases (using Vitest + Testing Library):

```
Suite: AuthContext
  ✓ Should provide initial state (user null, loading false)
  ✓ Should login and set user state
  ✓ Should logout and clear user state
  ✓ Should hydrate user on mount (from JWT)
  ✓ Should handle login errors
  ✓ Should handle network errors
  ✓ Should trigger logout on cross-tab storage event

Suite: Private Route
  ✓ Should render component if user logged in
  ✓ Should redirect to /login if user not logged in
  ✓ Should show loading state while checking auth
```

---

### **E2E Tests: `cypress/e2e/auth.cy.ts`**

Test cases (using Cypress):

```
Scenario: Full Registration to Dashboard
  1. User visits HomePage
  2. User clicks "Register"
  3. User fills in name, email, password
  4. User submits form
  5. System shows success
  6. User is redirected to /dashboard
  7. Dashboard shows user's name

Scenario: Full Login to Dashboard
  1. User visits LoginPage
  2. User fills in email + password
  3. User submits form
  4. User is redirected to /dashboard
  5. Dashboard shows user's name

Scenario: Logout
  1. User is logged in on /dashboard
  2. User clicks logout button
  3. User is redirected to /
  4. Attempting to visit /dashboard redirects to /login

Scenario: Cross-Tab Logout
  1. User is logged in on Tab 1
  2. Tab 2 opens same app (localStorage shared)
  3. User clicks logout on Tab 1
  4. Tab 2 automatically logs out (redirect to /login)

Scenario: Password Update
  1. User is logged in, visits /profile
  2. User fills old password + new password
  3. User submits form
  4. System shows success
  5. User can login with new password

Scenario: Email Update
  1. User is logged in, visits /profile
  2. User fills new email
  3. User submits form
  4. System shows success
  5. Current email updates
```

---

## 🚀 Implementation Order (Why This Matters)

**Phases 1-7 MUST be done in order.** Each depends on the previous.

**Phase 1:** Folder structure (can't write code without a place to put it)
**Phase 2:** Backend server (frontend needs backend to talk to)
**Phase 3:** Auth endpoints (most important feature)
**Phase 4:** Frontend structure (React setup)
**Phase 5:** Integration (wire frontend to backend)
**Phase 6:** One-command launch (DX polish)
**Phase 7:** Tests (proof it works)

---

## 📋 What Success Looks Like

By the end of Phase 7:

- ✅ `npm start` spins up backend + frontend
- ✅ You can register, login, logout
- ✅ Refresh page → Stay logged in
- ✅ Logout in Tab 1 → Tab 2 logs out
- ✅ Update password + email on /profile
- ✅ All tests pass
- ✅ You have a reusable starter template

---

## 🎓 Next Step

→ Phase 1: Set up the folder structure and package.json files. Ready when you are.
