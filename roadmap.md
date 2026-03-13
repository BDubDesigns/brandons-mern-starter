# MERN Starter — Build Roadmap

> **Status as of March 2026:** Phases 1–9 complete. Deployed to Render (backend) + Vercel (frontend). Phase 10 (Clerk Integration) in progress on `clerk-integration` branch.

---

# Phase 1: Repository & Folder Architecture

**Goal:** Set up the empty skeleton so you aren't fighting file paths later.

### Initialize the Repo

Create a folder named mern-starter (or whatever you prefer), run git init, and create a .gitignore file (add node_modules, .env).

### Structure the Root

Inside, create two main folders: frontend and backend.

> **Note:** This "Monorepo" style is easiest for solo developers.

### Root Package.json

Run npm init -y in the root folder. This will eventually hold scripts to run both the client and server simultaneously.

### Install Root Dev Tools

```bash
npm install concurrently --save-dev
```

(Allows you to run backend and frontend with one command).

### TypeScript Setup

This entire project will use **TypeScript**. Don't worry—you'll learn it as you go. The basics:

- `.ts` files for backend (Node/Express)
- `.tsx` files for frontend (React)
- Type annotations help catch bugs early and make code more readable.

> **Quick Win:** TypeScript is increasingly expected in job interviews. Learning it now as you build is the best approach.

---

# Phase 2: The Backend Foundation (Server Side)

**Goal:** A running server that connects to a database and handles errors gracefully.

### Initialize Backend

cd backend, run npm init -y.

### Setup TypeScript

```bash
npm install --save-dev typescript ts-node @types/node @types/express
npx tsc --init
```

This creates `tsconfig.json`. Keep defaults, but ensure `"target": "ES2020"` and `"module": "commonjs"`.

**Create `src/` folder** for all TypeScript files. You'll structure as:

```
src/
  ├── server.ts          (entry point)
  ├── config/            (db.ts, emailConfig.ts)
  ├── models/            (User.ts)
  ├── controllers/       (authController.ts)
  ├── routes/            (authRoutes.ts)
  ├── middleware/        (authMiddleware.ts, errorMiddleware.ts)
  └── types/             (custom type definitions)
```

### Install Essentials

```bash
npm install express mongoose dotenv cors helmet morgan
npm install nodemon --save-dev
```

(nodemon auto-restarts server on save).

### Basic Server Entry (server.ts)

Create `src/server.ts`. Set up a basic Express app listener with proper TypeScript types.

### Database Connection

Create `src/config/db.ts`. Write an async function that connects to MongoDB using `process.env.MONGO_URI`. Use Mongoose with TypeScript types. Call this function in server.ts.

### Environment Variables

Create a .env file in the backend folder. Add:

```
PORT=5000
MONGO_URI=....
```

### Global Error Handler

Create `src/middleware/errorMiddleware.ts`.

Write middleware that takes `(err: Error, req: Request, res: Response, next: NextFunction)` with proper TypeScript types and sends a clean JSON response instead of crashing the app or sending HTML stack traces.

---

# Phase 3: Auth & User Security (The Heavy Lifting)

**Goal:** Register users, hash passwords, and issue JWT tokens.

### Install Auth Tools

Inside backend:

```bash
npm install bcryptjs jsonwebtoken express-validator
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/express-validator
```

### User Model

Create `src/models/User.ts`. Define schema with TypeScript interface: name, email (unique), password.

> **Pro-Tip:** Add a pre-save hook here to hash the password with bcrypt automatically.

### Auth Controller

Create `src/controllers/authController.ts`.

- **registerUser:** Validate input, check if user exists, create user, return JWT.
- **loginUser:** Find user, bcrypt.compare password, return JWT.

### Auth Routes

Create `src/routes/authRoutes.ts` to link endpoints (`/api/auth/register`, `/api/auth/login`) to your controller functions.

### Protect Middleware

Create `src/middleware/authMiddleware.ts`.

**Logic:** Check headers for "Bearer token", verify with JWT secret, attach user to the req object.

### Email Verification Setup

**Install Email Tools:**

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Create `src/config/emailConfig.ts`:**

- Set up Nodemailer with Gmail using environment variables:
  - `GMAIL_USER` (your Gmail address)
  - `GMAIL_APP_PASSWORD` (your [App Password](https://support.google.com/accounts/answer/185833))
- Create a function `sendVerificationEmail(email: string, token: string)` that generates a verification link.

**Update User Model:**

- Add `isVerified` (boolean, default: false).
- Add `verificationToken` (string, nullable).
- Add `verificationTokenExpires` (Date, nullable).

**Create `src/controllers/emailController.ts`:**

- Function to send verification email on registration.
- Function to verify the token when user clicks the email link.

**Environment Toggle:**

- Add `ENABLE_EMAIL_VERIFICATION=true` to .env (boolean flag).
- In registerUser, conditionally send verification email based on this flag.

> **Gmail Setup:** Go to your Google Account settings → Security → App Passwords. Generate a new password for "Mail" and "Windows Computer". Use this 16-character password in `GMAIL_APP_PASSWORD`.

---

# Phase 4: The Frontend Foundation (Client Side)

**Goal:** A React app that is clean and ready for routing.

### Initialize Frontend

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
```

This creates a Vite + React + TypeScript template. Much faster than Create React App.

### Install Essentials

```bash
npm install react-router-dom axios
```

### Clean Up

Delete the default Vite boilerplate (the counter button, the logos) so you have a blank white page.

### Router Setup

In `src/App.tsx`, set up BrowserRouter. Create empty placeholder pages:

- `src/pages/HomePage.tsx` (public)
- `src/pages/Dashboard.tsx` (private)

### CSS Reset

**Install Tailwind CSS v4:**

```bash
npm install -D tailwindcss
npx tailwindcss init
```

**Add Tailwind directives to `src/index.css`:**

```css
@import "tailwindcss";
```

Done! Vite already imports `index.css` in `main.tsx`. No PostCSS config or file renaming needed.

That's it! Tailwind v4 is simpler—no PostCSS config needed, and it uses CSS-first setup. You can customize colors, spacing, etc. directly in `tailwind.config.ts` if needed, but the defaults work great.

---

# Phase 5: Connecting the Two (Integration)

**Goal:** The frontend talks to the backend and "remembers" the user.

### Axios Instance

Create `src/api/axios.ts`.

- Configure the baseURL (e.g., http://localhost:5000).
- Add an interceptor that automatically checks LocalStorage for a token and adds it to the Authorization header of every request.

### Auth Context

Create `src/context/AuthContext.tsx`. Use TypeScript interfaces for your user and context types.

**State:**

- `user` (null or object)
- `loading` (boolean)

**Functions:**

- `login(userData)`
- `logout()`

**Effect:** On app load, check if a token exists and fetch the user profile to keep them logged in on refresh.

> **Note on State Management:** This starter uses React Context for auth state. As your app grows, consider **Zustand** (simpler) or **Redux** (more verbose but industry-standard) for non-auth global state. Context is perfect for learning and small-to-medium projects.

### Private Route Component

Create `src/components/PrivateRoute.tsx`, a wrapper component that checks if a user is logged in. If not, redirect to Login. Wrap your Dashboard route with this.

---

# Phase 6: The "One-Command" Launch

**Goal:** Maximum laziness for future you.

### Go to Root package.json

Add this script:

```json
"scripts": {
  "start": "concurrently \"npm run server --prefix backend\" \"npm run dev --prefix frontend\""
}
```

### Test It

Run `npm start` from the root. Both your backend API and your frontend Vite server should spin up instantly.

---

# Phase 7: Testing (Unit & Integration) ✅

**Goal:** Write tests that prove your code works and give you confidence to refactor.

**Decision:** Vitest across both frontend and backend — one test runner to learn, native ESM + TypeScript support, zero config. Jest was rejected due to its poor ESM support.

### Backend Testing ✅

**Stack:** Vitest + Supertest + mongodb-memory-server

```bash
npm install --save-dev vitest supertest @types/supertest mongodb-memory-server
```

**Why mongodb-memory-server?** Spins up an in-memory MongoDB instance per test suite — no real database needed, fully isolated, no cleanup required between runs.

**Why Supertest?** Sends real HTTP requests to the Express app without starting a live server. Requires the app to be exported separately from `server.ts` — so `app.ts` exports the Express instance and `server.ts` calls `app.listen()`.

**Test structure:**

```
backend/src/tests/
  helpers/
  unit/
    authMiddleware.test.ts    ← verifyJWT middleware (7 tests)
    errorFormatter.test.ts    ← createFieldError utility (3 tests)
    errorMiddleware.test.ts   ← error classification (5 tests)
    tokenUtils.test.ts        ← JWT generation + formatting (7 tests)
  integration/
    auth.test.ts              ← all auth endpoints (43 tests)
```

**Total backend tests: 65 across 5 files.**

### Frontend Testing ✅

**Stack:** Vitest + React Testing Library + jsdom + MSW (Mock Service Worker)

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

**Why MSW?** Intercepts `fetch`/Axios calls at the network level in Node. Handlers are declared like Express routes — `http.post(url, resolver)` — and return `HttpResponse.json(body, { status })`. Default handlers live in `tests/mocks/handlers.ts`; per-test overrides use `server.use()`.

**Key patterns established:**

- `getByRole`, `getByLabelText`, `findByText` — RTL queries (never query by CSS class)
- `userEvent.setup()` + `await user.type/click()` — async user interaction
- `findBy` for anything after an async operation (waits for DOM update)
- `beforeEach(() => localStorage.clear())` — prevent cross-test state pollution
- `MemoryRouter initialEntries={["/path"]}` — control starting URL in tests
- `server.use()` — override a single handler for one test only

**Test structure:**

```
frontend/src/tests/
  mocks/
    handlers.ts     ← default MSW handlers for all API endpoints
    server.ts       ← MSW server instance (setupServer)
  setup.ts          ← jest-dom matchers + MSW lifecycle (beforeAll/afterEach/afterAll)
  unit/
    Button.test.tsx
    Divider.test.tsx
    FormInput.test.tsx
    getFieldErrors.test.ts
    PageCard.test.tsx
    ProtectedRoute.test.tsx
  integration/
    Dashboard.test.tsx
    Login.test.tsx
    Profile.test.tsx
    Register.test.tsx
```

**Total frontend tests: 36 across 10 files.**

### Combined Test Count

| Layer                | Files  | Tests   |
| -------------------- | ------ | ------- |
| Backend unit         | 4      | 22      |
| Backend integration  | 1      | 43      |
| Frontend unit        | 6      | 20      |
| Frontend integration | 4      | 36      |
| **Total**            | **15** | **121** |

**Run all tests:**

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

# Phase 8: E2E Testing (Playwright)

**Goal:** Simulate a real user in a real browser against the running application.

**Decision:** Playwright over Cypress. Playwright is the modern standard — faster, supports multiple browsers natively, better TypeScript integration, and no paid tier required for parallel runs.

### Install Playwright

From the root:

```bash
npm init playwright@latest
```

This scaffolds `playwright.config.ts`, an `e2e/` folder, and installs browser binaries.

### Configure for Local Dev

In `playwright.config.ts`:

- Set `baseURL` to `http://localhost:5173` (Vite dev server)
- Configure `webServer` to auto-start both frontend and backend before tests run

### Critical Journeys to Test

E2E tests cover only what unit and integration tests cannot — real browser behavior, cookies, actual redirects, and localStorage persistence across page loads.

| Journey               | Steps                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| **Registration flow** | Open `/register` → fill form → submit → land on `/dashboard` → see user name   |
| **Login flow**        | Open `/login` → fill credentials → submit → land on `/dashboard`               |
| **Logout flow**       | On `/dashboard` → click logout → land on `/login` → cannot access `/dashboard` |
| **Protected route**   | Open `/dashboard` directly without token → redirected to `/login`              |
| **Update password**   | On `/profile` → change password → logout → login with new password             |
| **Update email**      | On `/profile` → change email → new email displayed                             |

### Test Location

```
e2e/
  auth.spec.ts       ← registration, login, logout, protected route
  profile.spec.ts    ← update password, update email
```

### Add to Root `package.json`

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

# Phase 9: Deployment

**Goal:** The app is live and accessible from a public URL.

### Backend → Render or Railway

Both are free-tier friendly and support Node.js with environment variables.

1. Push backend to GitHub
2. Connect repo to Render/Railway
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
4. Set build command: `npm run build`
5. Set start command: `node dist/server.js`

### Frontend → Vercel

1. Push frontend to GitHub
2. Import repo in Vercel dashboard
3. Set `VITE_API_URL` to your deployed backend URL
4. Vercel handles the rest — automatic deploys on push to `main`

### MongoDB → MongoDB Atlas

If not already using Atlas, migrate from local MongoDB:

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist `0.0.0.0/0` (all IPs) for Render/Railway compatibility
3. Update `MONGO_URI` in your hosting environment variables

### Post-Deployment Checklist

- [ ] CORS configured to allow only the Vercel frontend URL in production
- [ ] `NODE_ENV=production` disables stack traces in error responses
- [ ] Refresh token cookie uses `secure: true` and `sameSite: none` in production
- [ ] All environment variables set — no hardcoded secrets in codebase

---

## API Conventions (REST)

As you build endpoints, follow RESTful standards:

- **GET** `/api/users/:id` — Fetch a user
- **POST** `/api/auth/register` — Create a new user
- **POST** `/api/auth/login` — Authenticate
- **POST** `/api/auth/verify-email` — Verify email token
- **PUT** `/api/users/:id` — Update user
- **DELETE** `/api/users/:id` — Delete user

This makes your API predictable and interview-friendly.

---

## Important Notes & Considerations

### TypeScript is Simpler Than You Think

You've used strong typing in PHP type hints—TypeScript is the same concept, but for JavaScript. You'll learn by doing, and most patterns are identical:

```typescript
// Backend example
interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
}

// Frontend example
type AuthContextType = {
  user: User | null;
  login: (userData: any) => Promise<void>;
  logout: () => void;
};
```

### Environment Variables

Both backend and frontend will need a `.env` file:

**Backend `.env`:**

```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mern-starter
JWT_SECRET=your-super-secret-jwt-key-make-it-long
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ENABLE_EMAIL_VERIFICATION=true
```

**Frontend `.env`:**

```
VITE_API_URL=http://localhost:5000
```

### Folder Structure Recap

```
mern-starter/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── types/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── api/
│   │   ├── tests/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env
│
├── package.json
└── .gitignore
```

### What Happens Next (After Phase 9)

Once deployed, the starter template is complete. From here you can build on it:

- Add password reset flow (email token → new password)
- Add email verification toggle (already scaffolded in the backend)
- Build real features on the Dashboard and Profile pages
- Add Zustand or Redux for non-auth global state as complexity grows
- ✅ Add API rate limiting (`express-rate-limit`) — applied to `/register` and `/login`
- Add request logging (`morgan`) to production
- Add monitoring (Sentry, LogRocket)

**This starter template is your foundation. Everything else is extensions.**

---

# Phase 10: Clerk Integration

**Goal:** Replace the custom JWT auth system with Clerk. Clerk handles authentication, session management, user management, and social login out of the box. The rest of the app (MongoDB, Express structure, React pages) is unchanged.

**Decision rationale:** The custom JWT system was built to learn auth fundamentals. See `auth_changes_spec.md` for the full stateful rotation design that was planned but not implemented — the spec itself is the portfolio artifact. Clerk is the production-grade choice for any real product.

## What Gets Removed

| File | Reason |
|---|---|
| `backend/src/controllers/authController.ts` | Clerk handles all auth logic |
| `backend/src/routes/authRoutes.ts` | Replaced by a single Clerk webhook route |
| `backend/src/middleware/authMiddleware.ts` | Replaced by `clerkMiddleware()` + `requireAuth()` |
| `backend/src/middleware/authValidation.ts` | Clerk handles validation |
| `backend/src/utils/tokenUtils.ts` | Clerk handles tokens |
| `backend/src/models/User.ts` | Clerk owns identity data |
| `frontend/src/context/AuthContext.tsx` | Replaced by `ClerkProvider` + `useUser()` |

## What Stays

- `app.ts` structure (add `clerkMiddleware()`, swap auth routes for webhook route)
- `server.ts`, `config/db.ts`, `errorMiddleware.ts`
- All frontend pages (swap `useAuth()` calls to Clerk equivalents)
- MongoDB for all application data (referenced by Clerk's `userId`)

## Key Pattern for App Data

All MongoDB collections reference Clerk's `userId` (a string like `user_2abc123`) as a foreign key. Clerk owns identity; MongoDB owns everything else.

```typescript
// Example: any future app-data collection
const SomeSchema = new Schema({
  clerkUserId: { type: String, required: true, index: true },
  // ... app-specific fields
})
```

## Steps

1. **Install packages** — `@clerk/clerk-react` (frontend), `@clerk/express` (backend)
2. **Create Clerk app** — dashboard.clerk.com, get publishable key + secret key
3. **Set env vars** — `VITE_CLERK_PUBLISHABLE_KEY` (frontend), `CLERK_SECRET_KEY` (backend)
4. **Wrap frontend** — `<ClerkProvider>` in `main.tsx`, replace `AuthProvider`
5. **Replace AuthContext** — `useUser()`, `useAuth()`, `<SignIn>`, `<SignUp>` components
6. **Update Axios interceptor** — use `await getToken()` from Clerk instead of localStorage
7. **Add `clerkMiddleware()`** to `app.ts`, replace `verifyJWT` with `requireAuth()`
8. **Remove old backend files** — controllers, routes, models, utils
9. **Update tests** — mock Clerk's `requireAuth()` in integration tests
10. **Deploy** — add Clerk env vars to Render + Vercel dashboards
