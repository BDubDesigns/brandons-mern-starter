import { describe, it, expect, vi, afterEach } from "vitest";
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
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.status(409).json).toHaveBeenCalledWith({
        statusCode: 409,
        message: "Email already exists",
      });
    });
  });

  describe("when the error is a Mongoose validation error", () => {
    it("should return 400 status code and a message indicating the validation error", () => {
      const mockObject = Object.assign(new Error("ValidationError"), {
        name: "ValidationError",
        errors: {
          email: { message: "Email is required" },
          password: { message: "Password must be at least 6 characters" },
        },
      });
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockObject, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.status(400).json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Email is required, Password must be at least 6 characters",
      });
    });
  });

  describe("when the error is a JsonWebTokenError", () => {
    it("should return a 401 status code and the message 'Invalid token'", () => {
      const mockObject = Object.assign(new Error("JsonWebTokenError"), {
        name: "JsonWebTokenError",
        message: "JWT error occurred",
      });
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockObject, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.status(401).json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Invalid token",
      });
    });
  });

  describe("when the error is a generic error", () => {
    it("should return a 500 status code with err.message", () => {
      const mockError = new Error("Something went wrong");
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockError, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status(500).json).toHaveBeenCalledWith({
        statusCode: 500,
        message: mockError.message,
      });
    });
  });

  describe("when the error is not an instance of Error", () => {
    it("should return a 500 status code with the string that was thrown", () => {
      const mockError = "Error occurred";
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockError, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status(500).json).toHaveBeenCalledWith({
        statusCode: 500,
        message: mockError,
      });
    });
  });

  describe("stack trace behavior", () => {
    afterEach(() => {
      vi.unstubAllEnvs(); // Reset NODE_ENV to its original value
    });
    it("should include stack trace in the response when NODE_ENV is 'development'", () => {
      vi.stubEnv("NODE_ENV", "development");
      const mockError = new Error("Stack trace test");
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockError, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status(500).json).toHaveBeenCalledWith({
        statusCode: 500,
        message: mockError.message,
        stack: mockError.stack,
      });
    });

    it("should not include stack trace in the response when NODE_ENV is not 'development'", () => {
      vi.stubEnv("NODE_ENV", "production");
      const mockError = new Error("No stack trace test");
      const mockReq = createMockReq();
      const mockRes = createMockRes();
      errorMiddleware(mockError, mockReq, mockRes, vi.fn() as NextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status(500).json).toHaveBeenCalledWith({
        statusCode: 500,
        message: mockError.message,
      });
    });
  });
});
