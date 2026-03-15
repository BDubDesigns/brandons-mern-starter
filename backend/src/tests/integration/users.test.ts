import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import "./setup.js"; // registers beforeAll/afterEach/afterAll for the in-memory MongoDB lifecycle
import { User } from "../../models/User.js";

// Mock Clerk — keeps tests self-contained without a live Clerk account.
// requireAuth checks for a Bearer token so tests can simulate auth/unauth cleanly.
vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  requireAuth:
    () =>
    (
      req: { headers: { authorization?: string }; auth?: { userId: string } },
      res: { status: (n: number) => { json: (b: unknown) => void } },
      next: () => void,
    ) => {
      if (!req.headers.authorization?.startsWith("Bearer ")) {
        res.status(401).json({ statusCode: 401, message: "Unauthorized" });
        return;
      }
      req.auth = { userId: "test-clerk-id" };
      next();
    },
  getAuth: (req: { auth?: { userId: string } }) => req.auth ?? { userId: null },
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "test-clerk-id",
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
    },
  },
}));

const { default: app } = await import("../../app.js");

describe("GET /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // reset call counts between tests (keeps mock implementations)
  });

  it("should return 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("should create and return a new user document on first access", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.clerkId).toBe("test-clerk-id");
    expect(res.body.email).toBe("test@example.com");

    const doc = await User.findOne({ clerkId: "test-clerk-id" });
    expect(doc).not.toBeNull();
  });

  it("should return the existing user document without calling the Clerk API", async () => {
    await User.create({ clerkId: "test-clerk-id", email: "test@example.com" });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.clerkId).toBe("test-clerk-id");

    const { clerkClient } = await import("@clerk/express");
    expect(clerkClient.users.getUser).not.toHaveBeenCalled();
  });
});
