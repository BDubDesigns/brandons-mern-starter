import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

// Middleware to handle validation errors from express-validator
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ message: "Validation errors", errors: errors.array() });
    return;
  }
  next();
};

// Define validation rules

// Validation rules for user registration
export const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain digit")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain special character"),
];

// validation rules for login
export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

// validation rules for update password
export const validateUpdatePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain digit")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain special character"),
];

// validation rules for update email
export const validateUpdateEmail = [
  body("newEmail").isEmail().withMessage("Invalid email format"),
];
