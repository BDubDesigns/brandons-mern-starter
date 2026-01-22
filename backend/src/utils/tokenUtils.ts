// utility functions for generating JWT tokens, used in authController and authMiddleware
import jwt from "jsonwebtoken";
// import the IUser interface from the User model to use in the prepareAuthResponse function
import type { IUser } from "../models/User.js";
// import Response type from Express for type safety in the setRefreshTokenCookie function
import type { Response } from "express";

// Helper function to generate a JWT and refresh token for a user, given their user ID and email
export const generateTokens = (
  userId: string,
  email: string
): { token: string; refreshToken: string } => {
  // generate jwt token with user ID and email as payload, signed with the secret from .env
  const secret = process.env.JWT_SECRET;

  // if the secret is not defined, log the error for debugging purposes, but throw a generic error to be handled by error middleware
  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables");
    throw new Error("Server configuration error: missing JWT_SECRET");
  }

  // create the payload with user ID and email
  const payload = { userId, email };

  // generate the jwt with a 15min expiration
  const token = jwt.sign(payload, secret, { expiresIn: "15m" });

  // generate refresh token with 7 day expiration
  const refreshToken = jwt.sign(payload, secret, { expiresIn: "7d" });

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

  const payload = { userId, email };
  const token = jwt.sign(payload, secret, { expiresIn: "15m" });
  return token;
};

// utility to format the user without password
export const formatUserWithoutPassword = (user: IUser) => {
  // build user object without password
  const userWithoutPassword = {
    _id: user._id,
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
    sameSite: "strict", // prevent CSRF attacks by only sending cookie for same-site requests
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};
