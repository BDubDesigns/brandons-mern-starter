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

# Phase 7: Testing (Unit & E2E)

**Goal:** Write tests that prove your code works and give you confidence to refactor.

### Backend Testing Setup

**Install Testing Tools:**

```bash
npm install --save-dev vitest @vitest/ui
```

**Create `vitest.config.ts`:**

- Configure Vitest for backend testing with Node environment.

**Create `tests/auth.test.ts`:**

- **Test 1:** Register a new user successfully.
- **Test 2:** Prevent duplicate email registration.
- **Test 3:** Hash password correctly (bcrypt).
- **Test 4:** Login with correct credentials returns a JWT.
- **Test 5:** Login with wrong password returns an error.

Use `describe` and `it` from Vitest for organizing tests.

### Frontend Testing Setup

**Install Testing Tools:**

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**Create `vitest.config.ts`:**

- Configure Vitest with jsdom environment for React testing.

**Create `src/tests/AuthContext.test.tsx`:**

- **Test 1:** AuthContext provides user state.
- **Test 2:** Login function updates user state.
- **Test 3:** Logout clears user state.

### E2E Testing (Optional but Recommended)

**Install E2E Tool:**

```bash
npm install --save-dev cypress
```

**Create `cypress/e2e/auth.cy.ts`:**

- **Test 1:** User can register and receive verification email.
- **Test 2:** User can click verification link and confirm account.
- **Test 3:** User can log in and access dashboard.
- **Test 4:** Logged-out users cannot access protected routes.

**Add to Root `package.json`:**

```json
"scripts": {
  "test": "npm run test --prefix backend && npm run test --prefix frontend",
  "test:e2e": "cypress open"
}
```

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

### What Happens Next (After Phase 7)

Once you have this starter template working, you can build on it:

- Add more API endpoints (user profile, password reset, etc.)
- Build real features on the Dashboard
- Deploy to Vercel (frontend) and Render/Railway (backend)
- Add more complex state management if needed
- Implement logging and monitoring
- Add API rate limiting and security headers

**This starter template is your foundation. Everything else is extensions.**
