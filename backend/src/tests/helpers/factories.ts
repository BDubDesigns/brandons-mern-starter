import type { IUser } from "../../models/User.js";
import { Types } from "mongoose";
import { vi } from "vitest";
import type { Request, Response } from "express";

// Factory function to create a mock IUser object for testing purposes, with optional overrides for specific fields
export const createMockUser = (overrides?: Partial<IUser>): IUser =>
  ({
    _id: new Types.ObjectId(), //generate a new ObjectId for the user ID
    name: "Test User",
    email: "test@example.com",
    password: "hashedpassword",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as IUser; // Type assertion to IUser, since we're not implementing the methods in this mock object

// Factory function to create a mock response object for testing purposes, with optional overrides for specific fields
export const createMockRes = (overrides?: Partial<Response>) => {
  const jsonMock = { json: vi.fn() };
  const res = {
    status: vi.fn().mockReturnValue(jsonMock),
    ...overrides,
  };
  return res as Response;
  // We have to use as unknown as Response because the mock object doesn't implement all methods of the Response interface, but we only need the methods we're testing.
};

// Factory function to create a mock request object for testing purposes, with optional overrides for specific fields
export const createMockReq = (overrides?: Partial<Request>) => {
  const req = { ...overrides } as Request;
  return req;
};
