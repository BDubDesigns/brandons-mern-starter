# MERN Starter

A production-ready full-stack MERN template with **Clerk authentication**, **MongoDB**, **Express**, **React**, and **Tailwind CSS**.

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
cd your-project
npm install
```

### 2. Environment Setup

Copy `.env.example` → `.env` in both `backend/` and `frontend/`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in your values:

**`backend/.env`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
CLERK_SECRET_KEY=sk_test_...          # From https://dashboard.clerk.com → API Keys
FRONTEND_URL=http://localhost:3000     # For local dev; change for production
NODE_ENV=development
PORT=5000
```

**`frontend/.env`**

```
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # From https://dashboard.clerk.com → API Keys
```

### 3. Start Development

```bash
npm run dev
```

Starts both backend (`:5000`) and frontend (`:3000`) with hot reload. See terminal output for URLs.

If ports are already in use:

```bash
npm run kill-ports    # Kill processes on :5000 and :3000
npm run dev           # Start fresh (kill-ports is built into `dev` now)
```

---

## npm Scripts

| Script               | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Start both backend and frontend (kills existing processes first) |
| `npm run kill-ports` | Free ports 5000 and 3000 (useful if process crashes)             |
| `npm test`           | Run backend tests (Vitest + Supertest)                           |
| `npm test:e2e`       | Run end-to-end tests (Playwright)                                |
| `npm run lint`       | Lint backend and frontend (ESLint)                               |

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express setup (CORS, middleware, routes)
│   │   ├── server.ts              # Entry point
│   │   ├── config/
│   │   │   └── db.ts              # MongoDB connection
│   │   ├── controllers/
│   │   │   └── userController.ts  # User endpoints logic
│   │   ├── models/
│   │   │   └── User.ts            # Mongoose User schema
│   │   ├── routes/
│   │   │   └── userRoutes.ts      # Protected user endpoints
│   │   ├── middleware/
│   │   │   └── errorMiddleware.ts # Error handling
│   │   ├── tests/
│   │   │   ├── integration/       # API tests (health, user routes)
│   │   │   └── unit/              # Unit tests (error handling)
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Route definitions
│   │   ├── main.tsx               # Entry point
│   │   ├── api/
│   │   │   └── client.ts          # Axios instance with Clerk auth + error handling
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Profile.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Main layout with Header + Outlet
│   │   │   ├── Header.tsx         # Nav + theme toggle
│   │   │   ├── ProtectedRoute.tsx # Auth guard
│   │   │   ├── PageCentered.tsx   # Centered layout (for login, etc.)
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── ThemeContext.ts    # Dark mode toggle
│   │   └── tests/
│   │       └── ...
│   ├── .env.example
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── e2e/                           # End-to-end tests (Playwright)
├── .gitignore
├── package.json                   # Root scripts (dev, kill-ports, test:e2e)
└── README.md
```

---

## Authentication (Clerk)

This starter uses **Clerk** for authentication — a managed service handling sign-up, sign-in, email verification, etc.

### Setup Clerk

1. Create account at https://clerk.com
2. Create a new application
3. Copy **Publishable Key** and **Secret Key** from **API Keys** page
4. Paste into `.env` files (see Environment Setup above)
5. Update CORS in `backend/src/app.ts` if needed:
   ```typescript
   const isProduction = origin === process.env.FRONTEND_URL;
   ```

### How It Works

- **Frontend:** Clerk components (`<SignIn>`, `<SignUp>`, `<UserProfile>`) embedded in React pages
- **Backend:** Clerk middleware validates Bearer token in request headers
- **Protected routes:** `ProtectedRoute` component redirects unauthenticated users to `/login`

**Adding protected endpoints:**

```typescript
// routes/userRoutes.ts
router.use(requireAuth()); // All routes below require auth
router.get("/me", getCurrentUser);
router.patch("/me", updateUser);
```

---

## Database (MongoDB + Mongoose)

### Local Development

Install MongoDB Community or use **MongoDB Atlas** (free tier):

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Copy connection string: `mongodb+srv://...`
4. Paste into `backend/.env` as `MONGODB_URI`

### User Model

The `User` model stores app-specific data linked to Clerk:

```typescript
{
  clerkId: string; // Link to Clerk user ID
  email: string; // User's email (from Clerk)
  createdAt: Date; // Timestamps
  updatedAt: Date;
}
```

**Extend it** by adding fields to `backend/src/models/User.ts`:

```typescript
// Example: add a game profile
const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    gameUsername: { type: String },
    gameLevel: { type: Number, default: 1 },
    // ... add your fields here
  },
  { timestamps: true },
);
```

---

## API Error Handling

**Backend** (`errorMiddleware.ts`) catches errors and returns consistent responses:

| Error                 | Status | Response                                               |
| --------------------- | ------ | ------------------------------------------------------ |
| MongoDB duplicate key | 409    | `{ statusCode: 409, message: "Email already exists" }` |
| Mongoose validation   | 400    | `{ statusCode: 400, message: "..." }`                  |
| Generic error         | 500    | `{ statusCode: 500, message: "..." }`                  |

**Frontend** (`api/client.ts`) handles responses:

- 401 (Unauthorized) → Auto sign-out
- Network errors → User-friendly message
- Other errors → Propagate to caller

---

## Styling

Uses **Tailwind CSS 4.1** with a custom theme:

- **Colors:** Light/dark mode via `ThemeContext`
- **Key classes:**
  - `bg-background` / `text-text` — adaptive to theme
  - `bg-surface` / `bg-interactive` — UI components
  - See `frontend/index.css` and `frontend/tailwind.config.ts` for full palette

Apply dark mode with:

```typescript
// Click theme button in Header, or:
const { cycleTheme } = useTheme();
cycleTheme(); // Cycles: light → dark → system
```

---

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Go to https://vercel.com → **New Project**
3. Select your repo → **Configure Project**
4. **Root Directory:** `frontend`
5. **Environment Variables:**
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   VITE_CLERK_PUBLISHABLE_KEY=pk_...
   ```
6. Deploy

### Backend → Render

1. Go to https://render.com → **New** → **Web Service**
2. Connect GitHub repo
3. **Root Directory:** `backend`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm start`
6. **Publish Port:** `5000`
7. **Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://...
   CLERK_SECRET_KEY=sk_test_...
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   PORT=5000
   ```
8. Deploy

### Custom Domain via Cloudflare

Assuming domain is registered via Cloudflare:

1. **Cloudflare Dashboard** → **DNS** → **Records**
2. Add CNAME records:
   ```
   yourdomain.com      CNAME→ vercel-project.vercel.app
   api.yourdomain.com  CNAME→ render-service.onrender.com
   ```
3. Update `FRONTEND_URL` in backend `.env` on Render
4. Wait for DNS to propagate (~5 min)

**Example for multiple games:**

```
qcfailed.com        → main-frontend.vercel.app
api.qcfailed.com    → main-backend.onrender.com

lh.qcfailed.com     → localhostile-frontend.vercel.app
api.lh.qcfailed.com → localhostile-backend.onrender.com
```

---

## Using as a Template

This repo is a **GitHub Template**. To create a new project:

1. Go to https://github.com/YOUR_USERNAME/mern-starter
2. Click **Use this template** → **Create a new repository**
3. Clone your new repo locally
4. Copy `.env.example` → `.env` files and fill in your keys
5. `npm install && npm run dev`

---

## Testing

### Backend Tests (Unit + Integration)

```bash
npm test
```

Tests verify:

- Error middleware (MongoDB, validation, generic errors)
- Health endpoint
- User endpoint (auth check, user creation, caching)

Tests use `mongodb-memory-server` for isolation — no external DB needed.

### E2E Tests (Playwright)

```bash
npm test:e2e          # Run tests
npm test:e2e:ui       # Run with debug UI
npm test:e2e:report   # Open HTML report
```

---

## Development Tips

### Hot Reload

- **Backend:** `tsx watch` restarts on file changes
- **Frontend:** Vite HMR (instant updates)
- Both survive crashes and automatically restart

### Debugging

- **Backend:** Add `console.log()` in Express handlers, check terminal
- **Frontend:** React DevTools browser extension (Chrome/Firefox)
- **API calls:** Network tab in Chrome DevTools, or check `api/client.ts` interceptor

### Adding New Routes

1. Create controller: `backend/src/controllers/gameController.ts`
2. Create routes: `backend/src/routes/gameRoutes.ts`
3. Wire into app: `backend/src/app.ts` → `app.use("/api/games", gameRoutes)`
4. Test with Playwright or `curl`/Postman

### Adding New Pages

1. Create page: `frontend/src/pages/Games.tsx`
2. Add route: `frontend/src/App.tsx`
3. Wrap in `<ProtectedRoute>` if auth required
4. Use theme with `useTheme()`, API with `apiClient`

---

## Security Notes

- **CORS:** Locked to `FRONTEND_URL` in production. Update `backend/src/app.ts` if needed.
- **Rate Limiting:** 100 requests/15min per IP (Vercel shows this as `X-RateLimit-*` headers)
- **Helmet:** Security headers enabled (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- **Clerk:** Handles password storage, email verification, session management
- **MongoDB:** Use strong passwords, enable IP whitelisting in Atlas

---

## Troubleshooting

| Issue                                         | Solution                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Port 3000/5000 already in use                 | `npm run kill-ports`                                                                  |
| Vite build fails on deploy (Vercel)           | Check `vite.config.ts` — ensure `strictPort: false` for production builds             |
| "No matching export for request" (ES modules) | Check imports use `.js` extension: `import x from "y.js"`                             |
| Clerk auth not working                        | Verify `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` match your Clerk dashboard |
| MongoDB connection fails                      | Check `MONGODB_URI` is correct, IP is whitelisted in Atlas                            |
| CORS errors                                   | Update `FRONTEND_URL` in `backend/.env` to match frontend domain                      |

---

## Stack Versions

- **Node.js** 18+
- **Express** 5.2
- **MongoDB** (Atlas or local)
- **Mongoose** 9.1
- **React** 19
- **Vite** 7.3
- **Tailwind CSS** 4.1
- **TypeScript** 5.9
- **Clerk** 6.1 (React SDK)

---

## License

ISC

---

**Questions?** Check the code comments or open an issue on GitHub.
