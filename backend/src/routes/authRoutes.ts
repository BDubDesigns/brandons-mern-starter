import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyJWT } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import type { Request } from "express";

// rate limiter for auth endpoints that are vulnerable to brute-force attacks
// allows 10 attempts per IP per 15 minutes before returning 429 Too Many Requests
// skipped entirely in test environment to prevent integration tests from tripping the limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 10,
  skip: () => process.env.NODE_ENV === "test", // bypass limiter in test environment
  message: { message: "Too many attempts, please try again later." },
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* headers
});

// rate limiter for refresh token endpoint, which is vulnerable to abuse if a refresh token is stolen, but we allow more attempts than login/register endpoints
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 30, // allow more requests for refresh token endpoint
  skip: () => process.env.NODE_ENV === "test", // bypass limiter in test environment
  keyGenerator: (req: Request): string => {
    const token: string | undefined = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.decode(token) as { userId?: string } | null;
      if (decoded?.userId) return decoded.userId;
    }
    return req.ip ?? "unknown";
  },
  message: { message: "Too many refresh attempts, please try again later." },
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* headers
});

// access authController functions via authController.functionName, e.g. authController.registerUser
// import validation middleware for registration endpoint
import {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdatePassword,
  validateUpdateEmail,
} from "../middleware/authValidation.js";

const router = Router();

// unprotected routes
router.post(
  "/register",
  authLimiter, // apply rate limiting before validation and controller
  validateRegister,
  handleValidationErrors,
  authController.registerUser,
);
router.post(
  "/login",
  authLimiter, // apply rate limiting before validation and controller
  validateLogin,
  handleValidationErrors,
  authController.loginUser,
);
router.post("/refresh", refreshLimiter, authController.refreshToken);

// protected routes
router.get("/me", verifyJWT, authController.getCurrentUser);
router.patch(
  "/update-password",
  verifyJWT,
  validateUpdatePassword,
  handleValidationErrors,
  authController.updatePassword,
);
router.patch(
  "/update-email",
  verifyJWT,
  validateUpdateEmail,
  handleValidationErrors,
  authController.updateEmail,
);

// logout route should maybe be delete but we use post for simplicity
// NEVER USE GET FOR LOGOUT ROUTES AS IT CAN BE TRIGGERED BY IMG TAGS AND LINKS!
router.post("/logout", verifyJWT, authController.logout);

export default router;
