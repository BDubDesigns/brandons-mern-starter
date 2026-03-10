// utility functions for generating JWT tokens, used in authController and authMiddleware
import jwt, { type SignOptions } from "jsonwebtoken";
// import the IUser interface from the User model to use in the prepareAuthResponse function
import type { IUser } from "../models/User.js";
// import Response type from Express for type safety in the setRefreshTokenCookie function
import type { Response } from "express";

import type { JWTPayload, UserResponse } from "../types/index.js";

// Helper function to parse an expiry string like "15m" or "7d" to ensure its a valid format for jwt.sign() options.
const parseExpiry = (
  value: string | undefined,
  fallback: string,
): NonNullable<SignOptions["expiresIn"]> => {
  // your regex check here for /^\d+\s*(ms|s|m|h|d|w|y)$/
  const regex = /^\d+\s*(ms|s|m|h|d|w|y)$/;
  if (!value || !regex.test(value)) {
    console.warn(
      `Invalid expiry format: ${value}. Falling back to default: ${fallback}`,
    );
    return fallback as NonNullable<SignOptions["expiresIn"]>;
  }
  return value as NonNullable<SignOptions["expiresIn"]>;
};

// Helper function to generate a JWT and refresh token for a user, given their user ID and email
export const generateTokens = (
  userId: string,
  email: string,
): { token: string; refreshToken: string } => {
  // generate jwt token with user ID and email as payload, signed with the secret from .env
  const secret = process.env.JWT_SECRET;

  // if the secret is not defined, log the error for debugging purposes, but throw a generic error to be handled by error middleware
  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables");
    throw new Error("Server configuration error: missing JWT_SECRET");
  }

  // create the payload with user ID and email
  const payload: JWTPayload = { userId, email };

  // generate the jwt with expiration from env, fallback to 15m
  const token = jwt.sign(payload, secret, {
    expiresIn: parseExpiry(process.env.JWT_EXPIRES_IN, "15m"),
  });

  // generate refresh token with expiration from env, fallback to 7d
  const refreshToken = jwt.sign(payload, secret, {
    expiresIn: parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN, "7d"),
  });

  // return both tokens as an object
  return { token, refreshToken };
};

// function to only generate the access token without the refresh token, used for refreshing the access token
// see above function for comments on error handling and secret management, which are the same for both functions
export const generateAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  // if the secret is not defined, log the error for debugging purposes, but throw a generic error to be handled by error middleware
  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables");
    throw new Error("Server configuration error: missing JWT_SECRET");
  }

  const payload: JWTPayload = { userId, email };
  const token = jwt.sign(payload, secret, {
    expiresIn: parseExpiry(process.env.JWT_EXPIRES_IN, "15m"),
  });
  return token;
};

// utility to format the user without password
export const formatUserWithoutPassword = (user: IUser): UserResponse => {
  // build user object without password
  const userWithoutPassword = {
    _id: user._id.toString(), // convert ObjectId to string for consistency in API responses
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // return the user object without password
  return userWithoutPassword;
};

// utility to set the refresh token cookie in the response, used in both register and login controllers to avoid code duplication
export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevents client-side JavaScript from accessing the cookie for security e.g. no xss attacks
    secure: process.env.NODE_ENV === "production", // only send cookie over HTTPS in production for security
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // cross-site in production (Vercel + Render), same-site in development
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};
