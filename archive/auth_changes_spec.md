# Auth Changes Spec: Stateful Refresh Token Rotation

**RFC Reference:** [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/rfc9700)

**Status:** Planning

---

## Why We're Doing This

The current system stores no record of issued refresh tokens. Any valid-looking JWT signed with the correct secret is accepted. This means:

- There is no way to revoke a specific session (e.g., "log out of my phone")
- A stolen refresh token is valid for the full 7-day window with no detection
- There is no signal to distinguish a legitimate multi-tab rotation from an attacker replaying a stolen token

Stateful rotation with reuse detection closes all three gaps.

---

## High-Level Architecture

### What Changes

| Layer               | Before                                    | After                                                           |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Refresh token       | Stateless JWT, nothing stored             | Hash stored in `RefreshToken` collection                        |
| `/refresh` endpoint | Verify signature → issue new access token | Verify signature → look up hash → rotate → detect reuse         |
| Logout              | Clear cookie                              | Clear cookie + delete `RefreshToken` document via hash lookup   |
| Login               | Issue JWT pair                            | Issue JWT pair + create `RefreshToken` document with `familyId` |
| Session lifetime    | 7-day refresh token (stateless)           | 30-day session (stateful rotation permits longer window safely) |

### What Does NOT Change

- Access tokens remain stateless JWTs (short-lived, 15 min)
- Cookie delivery mechanism (`HttpOnly`, `Secure`, `SameSite`) stays the same
- `User` model is untouched — no token arrays added to the user document
- Frontend code is untouched — it already handles 401 → redirect to login

---

## New Database Collection: `RefreshToken`

A separate Mongoose model. **Not** an array on the `User` document — that pattern causes unbounded document growth and write-lock contention at scale.

### Schema Fields

| Field           | Type                   | Description                                                                  |
| --------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `userId`        | `ObjectId` (ref: User) | Which user this session belongs to                                           |
| `familyId`      | `string` (UUID)        | Groups the rotation chain for one login session (one per device/browser)     |
| `tokenHash`     | `string`               | SHA-256 hash of the full JWT string (deterministic — same token = same hash) |
| `invalidatedAt` | `Date \| null`         | Set when this token is rotated out; null while active                        |
| `expiresAt`     | `Date`                 | Hard session expiry (30 days). MongoDB TTL index auto-deletes expired docs   |
| `createdAt`     | `Date`                 | Document creation time. Useful for debugging and audit trails                |

### Indexes

- TTL index on `expiresAt` (`expireAfterSeconds: 0`) — auto-deletes entire session documents after 30 days
- **Unique** index on `tokenHash` — fast lookup on every `/refresh` hit; uniqueness constraint prevents duplicate documents and protects against accidental double-issuance bugs
- Index on `familyId` — fast family-wide revocation on reuse detection
- Index on `userId` — required for future "logout all devices" (delete where `userId` matches); adding now avoids a collection scan at that point

### Why SHA-256 for `tokenHash` (not bcrypt)

bcrypt is intentionally slow to resist brute-force attacks on low-entropy secrets (passwords). Refresh tokens are already cryptographically random high-entropy strings — the security comes from their randomness, not the hash's slowness. SHA-256 via Node's built-in `crypto.createHash('sha256')` is the correct tool here, and it's what Auth.js and NextAuth use. No additional package required.

### What Is Being Hashed

Our refresh tokens are JWTs (signed with `JWT_SECRET`). We hash the **full JWT string** (`header.payload.signature`). This is correct and deterministic — the same token always produces the same hash, making it a reliable lookup key. An alternative approach would be to add a `jti` (JWT ID) claim and hash only that, but hashing the full string is simpler and equally correct for our purposes.

**JWT secret rotation note:** If `JWT_SECRET` is ever rotated, old tokens in the DB are signed with the old secret. Their signatures change meaning, but this is a non-issue in practice — old tokens will fail JWT verification at step 3 before the hash lookup ever runs, and the TTL index will clean them up within 30 days.

---

## Token Families

A `familyId` (UUID v4 via `crypto.randomUUID()`) is generated on every successful **login or registration**. Registration logs the user in immediately, so it follows the same code path and creates a family. It represents one device/browser session.

- Chrome Desktop login → `familyId: "abc-123"`
- Safari Mobile login → `familyId: "def-456"`

**Inclusion in tokens:** `familyId` is embedded in **both** the access token and refresh token JWT payloads. The access token's `familyId` is used for robust logout (see Logout section). The refresh token's `familyId` is used for reuse detection and session management.

Rotating a token advances the chain within `familyId: "abc-123"` only. The Safari session is completely unaffected. Logging out of one device deletes that family's documents.

---

## `/refresh` Endpoint Logic

```
1. Extract refreshToken from HttpOnly cookie
2. If no cookie → 401 Unauthorized
3. Verify JWT signature (existing check — unchanged)
4. Hash the token with SHA-256
5. Query RefreshToken collection for that hash
6. If no document found → 401 (token not issued by us, or already GC'd)
7. If document found AND invalidatedAt IS NULL → active token, proceed:
   a. Set invalidatedAt = Date.now() on this document
   b. Generate new JWT access + refresh token pair
   c. Hash new refresh token, insert new RefreshToken document (same familyId)
   d. Set new refresh token cookie
   e. Return new access token
8. If document found AND invalidatedAt IS NOT NULL:
   a. If invalidatedAt is within 10-second grace period → lost response recovery
      - The document found in step 5 is the ORIGINAL token (now invalidated by a previous rotation).
        Step 7 already created a NEW active document for this family. The atomic query targets that new one:
        findOneAndUpdate({ familyId, invalidatedAt: null }, { invalidatedAt: now })
      - If no active document found (another concurrent grace-period request already won) → 401
      - If active document found and updated (this request won):
        - Generate a brand new access + refresh token pair
        - Hash new refresh token, insert new RefreshToken document (same familyId)
        - Set new refresh token cookie, return new access token
      NOTE: The atomic query condition (invalidatedAt: null) ensures only ONE concurrent
      request can win the active document. The loser receives null and is rejected with 401.
      The loser's 401 must be treated by the frontend as a full session expiry requiring
      re-login — NOT as a transient error to retry. Retrying would either hit the new active
      document (not yet expired) as a fresh rotation, or loop uselessly.
      Original tokens cannot be recovered — access tokens are never stored and tokenHash is one-way.
   b. If invalidatedAt is older than 10 seconds → REUSE DETECTED (stolen token)
      - Log the event server-side with familyId for forensics (do NOT log the token)
      - Delete ALL RefreshToken documents for this familyId
      - Return 401 with a generic "session expired" message (do not reveal reuse was detected)
```

### The 10-Second Grace Period (Network Resilience)

**Purpose:** This exists for lost HTTP responses, NOT for tab coordination. Tab coordination is a frontend responsibility (see Frontend Coordination below).

**The scenario it solves:**

```
1. Phone sends /refresh with token A
2. Server rotates: A invalidated, B created, responds with Set-Cookie: B
3. Phone enters tunnel — response never arrives
4. Phone reconnects (still has token A in cookie — never received B)
5. Frontend retries /refresh with token A
6. Server finds token A with invalidatedAt set, 8 seconds ago → within grace → generates new pair C
```

Without this, a user driving through a tunnel gets logged out. TCP does NOT solve this — TCP retransmission deduplicates at the transport layer (the server sees one request), but if the TCP connection dies mid-response and the frontend retries at the application level, it's a brand new request with the old cookie.

**Why a new pair is generated (not the original):** Access tokens are stateless and never stored. `tokenHash` is a one-way SHA-256 hash — the original plaintext refresh token cannot be recovered from it. The original tokens are unrecoverable by design. A new pair is the only viable response.

**The security tradeoff this creates:** The grace period grants a valid new session to anyone presenting an invalidated token within 10 seconds — legitimate user OR attacker. BroadcastChannel prevents concurrent tabs from hitting this path, but it does NOT prevent an attacker from replaying a stolen token within 10 seconds of the victim's rotation.

This tradeoff is accepted because the attack prerequisites are severe: HttpOnly cookies cannot be stolen via XSS, requiring HTTPS MITM or physical device access. An attacker who already has that level of access can simply use the device directly. The 10-second replay window is narrow against an already-difficult attack vector.

**Mid-rotation insert failure:** If step 7c (inserting the new document) fails after step 7a (invalidating the old one), the user's token is invalidated with no replacement issued. The controller must catch this error, clear the refresh token cookie (keeping a now-invalidated cookie would cause repeated failed retries), and return 500. Re-login is the recovery path. MongoDB transactions (requiring a replica set) would prevent this, but Render's free tier runs a single MongoDB instance. This failure mode is accepted — it is rare and recoverable.

**Double-grace edge case (known unmitigated):** If a user rotates twice in rapid succession (token A → B → C) and then presents token B within its grace window, the server generates token D while C is still active. For a brief window, the family has two active documents (C and D). Reuse detection triggered on C from a legitimate source (e.g., another device) would incorrectly wipe the entire family. This scenario requires a coordination failure AND a network failure simultaneously — it cannot happen under normal BroadcastChannel operation. It is a known unmitigated edge case, not a design oversight.

---

## Frontend Coordination (Cross-Tab Token Refresh)

### The Problem

Without coordination, N tabs with an expired access token will each independently fire `/refresh`. The backend grace period exists for network failures — it should NOT be relied upon for tab dedup. These are separate concerns:

| Concern                                    | Owner    | Mechanism                             |
| ------------------------------------------ | -------- | ------------------------------------- |
| Multiple tabs refreshing simultaneously    | Frontend | BroadcastChannel / localStorage event |
| Lost HTTP response (tunnel, spotty mobile) | Backend  | 10-second grace period                |

### BroadcastChannel API (Primary — ~97% browser support)

The `BroadcastChannel` API (Chrome 54+, Firefox 38+, Edge 79+, Safari 15.4+) allows same-origin tabs to communicate without a server round-trip.

### localStorage Event Fallback (100% browser support)

For browsers without BroadcastChannel (Safari < 15.4, iOS 14 and older), the `storage` event (`window.addEventListener('storage', ...)`) fires across tabs when another tab writes to localStorage. This has been supported since IE8.

### Implementation Pattern (applies to both mechanisms)

```
1. Tab detects its access token is expired and needs a refresh
2. Tab checks if a refresh is already in-flight (via shared flag)
   - If no flag: claim leader, set flag, execute the /refresh API call
   - If flag exists: subscribe and wait for the result
3. Leader completes /refresh, receives new access token
4. Leader broadcasts the new access token via BroadcastChannel (or writes to localStorage)
5. All follower tabs receive the message, update their in-memory access token, and resume queued requests
6. Browser automatically handles the updated HttpOnly refresh token cookie across all tabs
```

**Feature detection:**

```typescript
if ("BroadcastChannel" in window) {
  // Use BroadcastChannel
} else {
  // Fall back to localStorage storage event
}
```

**Within-tab request queue:** In addition to cross-tab coordination (BroadcastChannel/localStorage), the Axios interceptor should implement a **request queue** for the same tab. When an access token expires, pause all outgoing API calls, push them into an array, execute a single `/refresh`, and resume the queued requests with the new token. This eliminates redundant refresh calls within the same tab even in edge cases where frontend coordination is delayed by browser background-tab throttling.

**localStorage same-tab edge case:** The `storage` event technically fires on all tabs _except_ the one that wrote to localStorage per the spec. However, some older browser implementations fire it on the originating tab as well. The leader-election flag logic should be written defensively — if a tab receives a storage event for a token it just wrote, it should no-op rather than treat itself as a follower.

**Result:** Under normal conditions, only ONE `/refresh` request fires per token expiry window globally (across all tabs) and within each tab, regardless of tab count or browser version. The backend grace period is a last-resort safety net for network failures only.

**Scope:** This lives in the frontend Axios interceptor (`src/api/axios.ts`), not the backend. Backend behaviour is unchanged.

---

## Cookie Settings (Production vs Development)

> **Note:** The context this spec was based on recommended `SameSite=Strict`. That is **not compatible** with this deployment — frontend is on Vercel, backend is on Render. These are different domains, making every request cross-site. Cross-site cookies require `SameSite=None; Secure`. The current codebase already has the correct conditional and it stays.

```typescript
sameSite: process.env.NODE_ENV === "production" ? "none" : "strict";
secure: process.env.NODE_ENV === "production";
```

---

## Logout

The logout controller uses the access token (which is always valid for protected routes) to extract `familyId`:

1. Extract `familyId` from the **access token JWT payload**
2. Delete ALL `RefreshToken` documents where `familyId` matches (wipes the entire device session in one query)
3. Clear the refresh token cookie
4. Frontend discards the access token from memory

This approach is robust to the case where a user rotates their token in Tab A but logs out in Tab B before the new cookie propagates. Tab B's refresh cookie may be stale, but the access token is always current, so `familyId` lookup succeeds.

**"Logout all devices"** (future extension): delete ALL `RefreshToken` documents where `userId` matches. Not in scope for this implementation but trivially addable.

**Logout race condition:** If logout runs mid-rotation, an orphaned valid refresh token may persist in the DB under the new `familyId` that the rotation just created. The user cannot log out again to fix this because their cookie holds the old token, not the new one. The real backstop is `expiresAt` TTL — the orphaned document will be auto-deleted by MongoDB within 30 days. This is accepted as best-effort logout, consistent with how production systems like Auth0 handle the same race.

---

## Stale Token Cleanup

Each successful rotation leaves behind a document with `invalidatedAt` set. These are no longer usable (except within the 10-second grace period), but they accumulate in the collection until the session's `expiresAt` TTL fires — up to 30 days.

**Cleanup strategy: application-level deletion on rotation (Option A).**

During step 7 of the `/refresh` logic — after the new document is saved and the response is sent — delete all documents for the same `familyId` where:

```
invalidatedAt IS NOT NULL AND invalidatedAt < (now - 10 seconds)
```

Execute this cleanup **asynchronously without awaiting it.** The `/refresh` endpoint is latency-sensitive (frontend requests are paused while waiting for it). The cleanup query should fire in the background after the HTTP response is sent, not before. This removes write latency from the critical path. On average, each family keeps at most two documents at any point: the current active one and the one just rotated out (still within its 10-second grace window).

**Alignment with grace period:** The cleanup predicate (`invalidatedAt < now - 10s`) is intentionally aligned with the grace window (`invalidatedAt within 10s of now`). A document within the grace window will never satisfy the cleanup predicate. There is no conflict between these two features.

**Cleanup boundary note:** If a cleanup runs on a document from a very slow mobile retry that coincidentally falls just outside 10 seconds, it could delete a document the user is about to present. In practice this requires a mobile reconnection taking exactly 10-11 seconds, and the outcome is a 401 followed by re-login — the same result as a reconnection taking 30 seconds. Acceptable.

---

## Rate Limiting (Revised)

The earlier plan to rate-limit `/refresh` by user ID was abandoned because `jwt.decode()` (without signature verification) as a key generator creates a targeted DoS vector — an attacker crafts a token with a victim's userId to exhaust their limit.

The revised approach: IP-based rate limiting on `/refresh` with a generous limit (60 req / 15 min). This is a secondary defense-in-depth layer only. The primary defense is reuse detection — no rate limit is needed to prevent replay attacks because the token is single-use.

**Render proxy note:** Render (and most PaaS) sits behind a load balancer. Without `app.set('trust proxy', 1)` in Express, `req.ip` resolves to the proxy IP and every user shares the same rate limit bucket. This must be configured in `app.ts`. This setting is global and intentionally so — on Render, the forwarded client IP is the correct value for `req.ip` on all routes.

---

## Files to Create / Modify

| File                                         | Change                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `backend/src/models/RefreshToken.ts`         | **Create** — new Mongoose model                                           |
| `backend/src/controllers/authController.ts`  | **Modify** — update `login`, `register`, `refreshToken`, `logout`         |
| `backend/src/utils/tokenUtils.ts`            | **Modify** — add `hashToken(token)` helper                                |
| `backend/src/routes/authRoutes.ts`           | **Modify** — remove `keyGenerator` from refreshLimiter                    |
| `backend/src/app.ts`                         | **Modify** — add `app.set('trust proxy', 1)` for correct IP behind Render |
| `backend/src/tests/integration/auth.test.ts` | **Modify** — update tests for new rotation behavior                       |

---

**Duplicate-key error handling:** If the unique index on `tokenHash` rejects an insert (MongoDB error code 11000), the controller must catch it explicitly and return 500 — not let it propagate as an unhandled crash. This should not happen under correct operation but protects against bugs.

---

## Out of Scope

- Email verification (already scaffolded, separate feature)
- Password reset flow (separate feature)
- "Remember me" extended sessions
- Redis-based token storage (MongoDB TTL is sufficient at this scale)

---

## Future Improvements

**Opaque refresh tokens:** Currently, refresh tokens are JWTs. Since they are now stateful (verified via database lookup), the JWT's stateless benefit is unused. A future refactor could replace refresh tokens with cryptographically secure opaque strings (`crypto.randomBytes(32).toString('hex')`), reducing cookie bandwidth and eliminating JWT secret rotation edge cases. This would remove step 3 (JWT verification) from the `/refresh` flow, relying entirely on the database lookup for validation.
