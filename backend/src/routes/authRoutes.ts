import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
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
  validateRegister,
  handleValidationErrors,
  authController.registerUser
);
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  authController.loginUser
);
router.post("/refresh", authController.refreshToken);

// protected routes
router.get("/me", verifyJWT, authController.getCurrentUser);
router.patch(
  "/update-password",
  verifyJWT,
  validateUpdatePassword,
  handleValidationErrors,
  authController.updatePassword
);
router.patch(
  "/update-email",
  verifyJWT,
  validateUpdateEmail,
  handleValidationErrors,
  authController.updateEmail
);

// logout route should maybe be delete but we use post for simplicity
// NEVER USE GET FOR LOGOUT ROUTES AS IT CAN BE TRIGGERED BY IMG TAGS AND LINKS!
router.post("/logout", verifyJWT, authController.logout);

export default router;
