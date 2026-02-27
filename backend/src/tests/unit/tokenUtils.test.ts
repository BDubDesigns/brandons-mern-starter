import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateTokens,
  generateAccessToken,
  formatUserWithoutPassword,
} from "../../utils/tokenUtils.js";
import { createMockUser } from "../helpers/factories.js";

// Define test user data for use in the tests
const userId = "user123";
const email = "user@example.com";

// runs before each test to set up the environment variable for JWT_SECRET
beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret-123");
});

// runs after each test to restore the original environment variables
afterEach(() => {
  vi.unstubAllEnvs();
});

// Shape is guaranteed by TypeScript return types — tests cover behavior only.

// Tests for the generateTokens function
describe("generateTokens()", () => {
  it("should generate valid JWT tokens that can be verified", () => {
    // Call the function to get the tokens
    const tokens = generateTokens(userId, email);

    // Verify the token using the JWT_SECRET
    const decodedToken = jwt.verify(tokens.token, "test-secret-123");
    const decodedRefreshToken = jwt.verify(
      tokens.refreshToken,
      "test-secret-123",
    );

    // assert that the decoded tokens have the correct payload
    expect(decodedToken).toHaveProperty("userId", userId);
    expect(decodedToken).toHaveProperty("email", email);
    expect(decodedRefreshToken).toHaveProperty("userId", userId);
    expect(decodedRefreshToken).toHaveProperty("email", email);
  });

  it("should throw an error if JWT_SECRET is not set", () => {
    // Unset the JWT_SECRET environment variable to simulate the error condition
    vi.stubEnv("JWT_SECRET", "");

    // Assert that calling the function without JWT_SECRET throws an error
    expect(() => generateTokens(userId, email)).toThrow(
      "Server configuration error: missing JWT_SECRET",
    );
  });
});

describe("generateAccessToken()", () => {
  it("should generate a valid JWT access token", () => {
    // call the function to get the access token
    const token = generateAccessToken(userId, email);

    // decode the token using the JWT_SECRET
    const decodedToken = jwt.verify(token, "test-secret-123");

    // assert that the decoded token has the correct payload
    expect(decodedToken).toHaveProperty("userId", userId);
    expect(decodedToken).toHaveProperty("email", email);
  });

  it("should throw an error if JWT_SECRET is not set", () => {
    // Unset the JWT_SECRET environment variable to simulate the error condition
    vi.stubEnv("JWT_SECRET", "");

    // Assert that calling the function without JWT_SECRET throws an error
    expect(() => generateAccessToken(userId, email)).toThrow(
      "Server configuration error: missing JWT_SECRET",
    );
  });
});

describe("formatUserWithoutPassword()", () => {
  it("should return a user object without the password field", () => {
    const mockedUser = createMockUser();
    const userSansPassword = formatUserWithoutPassword(mockedUser);

    expect(userSansPassword).not.toHaveProperty("password");
  });
});
