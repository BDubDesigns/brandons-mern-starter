import "./setup.js";
import request from "supertest";
import app from "../../app.js";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

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
  beforeEach(async () => {
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
  // define a variable to hold the refresh token cookie for use in the tests
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
});

describe("PATCH /api/auth/update-password", () => {
  // define a variable to hold the token for use in the tests
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "refresh@test.com",
      password: "Password1!",
    });
    token = res.body.token; // grab the token string
  });

  describe("with correct current password and valid new password", () => {
    it("should return 200 'Password updated successfully'", async () => {
      const res = await request(app)
        .patch("/api/auth/update-password")
        .set("authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password1!",
          newPassword: "Password2!",
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password updated successfully");
    });
  });

  describe("with wrong current password", () => {
    it("should return 400 and field error on 'currentPassword'", async () => {
      const res = await request(app)
        .patch("/api/auth/update-password")
        .set("authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongPassword1!",
          newPassword: "Password2!",
        });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe("Current password is incorrect");
    });
  });
  // Can login with new password after update	200 on subsequent login
  describe("after updating password, can login with new password", () => {
    it("should allow login with new password after update", async () => {
      // First, update the password
      await request(app)
        .patch("/api/auth/update-password")
        .set("authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password1!",
          newPassword: "Password2!",
        });
      // Then, attempt to login with the new password
      const res = await request(app).post("/api/auth/login").send({
        email: "refresh@test.com",
        password: "Password2!",
      });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe("string");
    });
  });
});

describe("PATCH /api/auth/update-email", () => {
  // define a variable to hold the token for use in the tests
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "refresh@test.com",
      password: "Password1!",
    });
    token = res.body.token; // grab the token string
  });

  describe("with valid new email and correct password", () => {
    it("should return 200 and update email with new token and user data", async () => {
      const res = await request(app)
        .patch("/api/auth/update-email")
        .set("authorization", `Bearer ${token}`)
        .send({
          newEmail: "newemail@test.com",
          password: "Password1!",
        });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe("string");
      expect(res.body.user).toHaveProperty("_id");
      expect(res.body.user).toHaveProperty("email", "newemail@test.com");
      expect(res.body.user).not.toHaveProperty("password");
    });
  });

  describe("with wrong password", () => {
    it("should return 400 and field error on 'password'", async () => {
      const res = await request(app)
        .patch("/api/auth/update-email")
        .set("authorization", `Bearer ${token}`)
        .send({
          newEmail: "newemail@test.com",
          password: "WrongPassword1!",
        });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe("Password is incorrect");
    });
  });

  describe("with new email equal to current email", () => {
    it("should return 400 and a field error on 'newEmail'", async () => {
      const res = await request(app)
        .patch("/api/auth/update-email")
        .set("authorization", `Bearer ${token}`)
        .send({
          newEmail: "refresh@test.com", // same address as the registered user
          password: "Password1!",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "New email must be different from current email",
      );
    });
  });
});

describe("POST /api/auth/logout", () => {
  // define a variable to hold the token for use in the tests
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "refresh@test.com",
      password: "Password1!",
    });
    token = res.body.token; // grab the token string
  });

  it("should return 204 and clear the refresh token cookie", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(res.headers["set-cookie"]![0]).toContain("refreshToken=;");
  });
});
