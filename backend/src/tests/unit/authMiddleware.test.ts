// import vitest functions
import { describe, vi, beforeEach, afterEach, it, expect } from "vitest";
// import NextFunction type from express for typing the next function in middleware
import type { NextFunction } from "express";
// import the verifyJWT middleware function to be tested
import { verifyJWT } from "../../middleware/authMiddleware.js";
// import jwt for token creation in tests
import jwt from "jsonwebtoken";
// import generateAccessToken utility function to create a valid JWT token for testing
import { generateAccessToken } from "../../utils/tokenUtils.js";
// import the createMockRes helper function to create a mock response object for testing
import { createMockRes, createMockReq } from "../helpers/factories.js";
// runs before each test to set up the environment variable for JWT_SECRET
beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret-123");
});

// runs after each test to restore the original environment variables
afterEach(() => {
  vi.unstubAllEnvs();
});

// Tests for the verifyJWT middleware function
describe("verifyJWT()", () => {
  describe("when a valid token is provided", () => {
    // Declare variables to hold the token, mock request, response, and next function
    let token: string;
    let req: ReturnType<typeof createMockReq>;
    let res: ReturnType<typeof createMockRes>;
    let next: NextFunction;

    // runs before each test in this describe block to set up the mock request, response, and next function
    beforeEach(() => {
      // Generate a valid JWT token for testing
      token = generateAccessToken("user123", "test@example.com");
      // Use the imported mock request and response factory functions to create mock objects
      req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      res = createMockRes();
      next = vi.fn() as NextFunction;
    });

    it("should call next() when a valid JWT token is provided", () => {
      // Call the verifyJWT middleware with the mock request, response, and next function
      verifyJWT(req, res, next);
      // Assert that the `next()` function was called, indicating successful JWT verification
      expect(next).toHaveBeenCalled();
    });

    it("should attach the user object to the request when a valid JWT token is provided", () => {
      // Call the verifyJWT middleware with the mock request, response, and next function
      verifyJWT(req, res, next);
      // Assert that the `req.user` object is attached and has the expected properties
      expect(req.user).toBeDefined();
      expect(req.user).toHaveProperty("userId", "user123");
      expect(req.user).toHaveProperty("email", "test@example.com");
    });
  });

  describe("when the authorization header is missing or invalid", () => {
    it("should return 401 Unauthorized", () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;
      verifyJWT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.status(401).json).toHaveBeenCalledWith({
        message: "Missing or invalid auth header",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the JWT_SECRET is not set", () => {
    it("should return 500 server error", () => {
      const token = generateAccessToken("user123", "test@example.com");
      vi.stubEnv("JWT_SECRET", ""); // Unset the JWT_SECRET environment variable
      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;
      verifyJWT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status(500).json).toHaveBeenCalledWith({
        message: "Server error",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the token is invalid or expired", () => {
    it("should return 401 Unauthorized", () => {
      const req = createMockReq({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;
      verifyJWT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.status(401).json).toHaveBeenCalledWith({
        message: "Invalid or expired token",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the token payload is missing required properties", () => {
    it("should return 401 Unauthorized", () => {
      // Create a token with an invalid payload (missing userId and email)
      const invalidPayloadToken = jwt.sign({}, "test-secret-123");
      const req = createMockReq({
        headers: { authorization: `Bearer ${invalidPayloadToken}` },
      });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;
      verifyJWT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.status(401).json).toHaveBeenCalledWith({
        message: "Invalid token payload",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
