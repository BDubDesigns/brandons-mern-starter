import { describe, it, expect, vi } from "vitest";
import errorMiddleware from "../../middleware/errorMiddleware.js";
import { createMockReq, createMockRes } from "../helpers/factories.js";
import type { NextFunction } from "express";

describe("Error Middleware", () => {
  describe("when the error is a MongoDB duplicate key error", () => {
    it("should return 409 status code and a message indicating that the email is already in use", () => {
      const mockError = Object.assign(new Error("Duplicate key error"), {
        name: "MongoError",
        code: 11000,
        message:
          'E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@example.com" }',
      });
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockError, mockReq, mockRes, vi.fn() as NextFunction);
    });
  });
});
