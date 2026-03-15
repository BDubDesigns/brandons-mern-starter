import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Prevent clerkMiddleware and requireAuth from throwing due to missing CLERK_SECRET_KEY in tests
vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  requireAuth: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const { default: app } = await import("../../app.js");

describe("GET /api/health", () => {
  it("should return 200 with a healthy status message", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ statusCode: 200, message: "Server is healthy" });
  });
});
