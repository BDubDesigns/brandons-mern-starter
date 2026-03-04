import "./setup.js";
import request from "supertest";
import app from "../../app.js";
import { beforeAll, describe, expect, it } from "vitest";

// Scenario, Expected

// Weak password (no uppercase)	400, validation error message
// Duplicate email	400, "Email already in use"

describe("POST /api/auth/register", () => {
  it("should register a new user and return a token and user object", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password1!",
    });
    // Assert that the response has a 201 status code and contains the expected properties
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user).toHaveProperty("name", "Test User");
    expect(res.body.user).toHaveProperty("email", "test@example.com");
    expect(res.body.user).not.toHaveProperty("password");
    // Check that the refresh token cookie is set
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  describe("when required fields are missing", () => {
    it("should return 400 and a field error when 'name' is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "Password1!",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe("Name must be at least 2 characters");
    });

    it("should return 400 and field error when 'email' is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        password: "Password1!",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe("Invalid email format");
    });

    it("should return 400 and field error when 'password' is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "Password must be at least 8 characters",
      );
    });
  });

  it("should return 400 and validation error when password doesn't meet complexity requirements", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Password must contain uppercase letter",
        }),
      ]),
    );
  });

  it("should return 400 and validation error when email is already in use", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password1!",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toBe("Email already in use");
  });
});

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "login@test.com",
      password: "Password1!",
    });
  });

  it("should login a user with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "Password1!",
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user).toHaveProperty("name", "Test User");
    expect(res.body.user).toHaveProperty("email", "login@test.com");
    expect(res.body.user).not.toHaveProperty("password");
    // Check that the refresh token cookie is set
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  describe("when the email or password is invalid", () => {
    it("should return 401 'Invalid email or password' when password is invalid", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@test.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should return 401 'Invalid email or password' when email does not exist", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@test.com",
        password: "Password1!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });

  it("should return 400 and validation error when email is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "Password1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toBe("Invalid email format");
  });
});

describe("GET /api/auth/me", () => {
  // define token variable at the describe level to hold the token for use in subsequent tests
  let token: string;

  // beforeAll hook to register a user before running the login tests
  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "login@test.com",
      password: "Password1!",
    });

    // store the token from the registration response for use in subsequent tests
    token = res.body.token;
  });
  it("should return 200 and user data when a valid token is provided", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user).toHaveProperty("name", "Test User");
    expect(res.body.user).toHaveProperty("email", "login@test.com");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should return 401 when no Authorization header is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing or invalid auth header");
  });
});

describe("POST /api/auth/refresh", () => {
  let refreshTokenCookie: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "refresh@test.com",
      password: "Password1!",
    });
    refreshTokenCookie = res.headers["set-cookie"]![0]!; // grab the cookie string
  });

  it("should return 200 and a new access token when a valid refresh token cookie is provided", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshTokenCookie);
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("should return 401 when no refresh token cookie is provided", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return 401 when an invalid refresh token cookie is provided", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=invalidtoken");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid refresh token");
  });
});
