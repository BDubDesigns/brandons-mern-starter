import User from "../models/User.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
// import the utils for generating access and refresh tokens
import {
  generateTokens,
  generateAccessToken,
  formatUserWithoutPassword,
  setRefreshTokenCookie,
} from "../utils/tokenUtils.js";

// register user controller
export const registerUser = async (req: Request, res: Response) => {
  // get name, email, and both password fields from the request body
  const { name, email, password1, password2 } = req.body;

  // validate that all required fields are provided
  if (!name || !email || !password1 || !password2) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // validate that the password and confirm password fields match
  if (password1 !== password2) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }
  // Email uniqueness is enforced by the User model's unique index; duplicate emails will be caught by error middleware

  // create and save the new user to the database using the User model, which will trigger the pre-save middleware to hash the password
  const newUser = await User.create({ name, email, password: password1 });

  // generate JWT and refresh token for the new user using the utility function
  const { token, refreshToken } = generateTokens(
    newUser._id.toString(),
    newUser.email
  );

  // set the refresh token as an HTTP-only cookie with a 7 day expiration
  setRefreshTokenCookie(res, refreshToken);

  // prepare the response object with user info except the password
  const formattedUser = formatUserWithoutPassword(newUser);

  // return the JWT in the response body for the frontend to use in authenticated requests
  res.status(201).json({ token, user: formattedUser }); // return the user info except the password
};

// login user controller
export const loginUser = async (req: Request, res: Response) => {
  // get email and password from the request body
  const { email, password } = req.body;

  // define a generic error message to return for both invalid email and invalid password cases to avoid user enumeration attacks
  const genericErrorMessage = "Invalid email or password";

  // validate that both email and password are provided
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  // find the user in the database by their email
  const user = await User.findOne({ email });

  // if the user is not found, return a generic error message to avoid revealing whether the email exists in the system for security
  if (!user) {
    res.status(401).json({ message: genericErrorMessage });
    return;
  }

  // compare the provided password with the hashed password stored in the database using the comparePassword method in the User model
  const isPasswordValid = await user.comparePassword(password);

  // if the password is invalid, return the same generic error message for security
  if (!isPasswordValid) {
    res.status(401).json({ message: genericErrorMessage });
    return;
  }

  // generate JWT and refresh token for the authenticated user using the utility function
  const { token, refreshToken } = generateTokens(
    user._id.toString(),
    user.email
  );

  // set the refresh token as an HTTP-only cookie with a 7 day expiration
  setRefreshTokenCookie(res, refreshToken);

  const formattedUser = formatUserWithoutPassword(user);

  // return the JWT in the response body for the frontend to use in authenticated requests, along with user info except the password
  res.status(200).json({ token, user: formattedUser });
};

// refresh token controller
export const refreshToken = async (req: Request, res: Response) => {
  // get the refresh token from the cookies
  const { refreshToken } = req.cookies;

  // if the refresh token is not provided, return 401 Unauthorized
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // verify the refresh token and generate a new access token
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables");
      throw new Error("Server configuration error: missing JWT_SECRET");
    }

    // verify the refresh token and extract the payload, which contains the user ID and email
    const payload = jwt.verify(refreshToken, secret) as {
      userId: string;
      email: string;
    };

    // check that the payload is valid and has the required properties
    if (!payload || !payload.userId || !payload.email) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    // generate a new access token using the payload from the refresh token
    const newAccessToken = generateAccessToken(payload.userId, payload.email);

    // return the new access token in the response body for the frontend to use in authenticated requests
    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
};

// get current user controller
export const getCurrentUser = async (req: Request, res: Response) => {
  // early return if req.user is not set by the auth middleware, which means the token was invalid or missing
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // req.user has email and userid, which we can use to find the user in the database and return their info
  // get the user from the database by their ID, and exclude the password field from the returned document for security
  const user = await User.findById(req.user.userId).select("-password");
  // if the user is not found (which could happen if the user was deleted after the token was issued), return 404 Not Found
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  // return the user info in the response
  res.status(200).json({ user });
};

// update password controller
export const updatePassword = async (req: Request, res: Response) => {
  // early return if req.user is not set by the auth middleware, which means the token was invalid or missing
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // get the current password and new password from the request body
  const { currentPassword, newPassword } = req.body;

  // validate that both current password and new password are provided
  if (!currentPassword || !newPassword) {
    res
      .status(400)
      .json({ message: "Current password and new password are required" });
    return;
  }

  // get the user from the database by their ID
  const user = await User.findById(req.user.userId);

  // if the user is not found (which could happen if the user was deleted after the token was issued), return 404 Not Found
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // compare the provided current password with the hashed password stored in the database using the comparePassword method in the User model
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  // if the current password is invalid, return 401 Unauthorized
  if (!isCurrentPasswordValid) {
    res.status(401).json({ message: "Current password is incorrect" });
    return;
  }

  // update the user's password using the updatePassword method in the User model, which will trigger the pre-save middleware to hash the new password
  await user.updatePassword(newPassword);
  res.status(200).json({ message: "Password updated successfully" });
};

// update email controller
export const updateEmail = async (req: Request, res: Response) => {
  // early return if req.user is not set by the auth middleware, which means the token was invalid or missing
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // validate input
  const { newEmail, password } = req.body;
  if (!newEmail) {
    res.status(400).json({ message: "New email is required" });
    return;
  }
  if (!password) {
    res.status(400).json({ message: "Password is required" });
    return;
  }

  // find user
  const user = await User.findById(req.user.userId);

  // if the user is not found (which could happen if the user was deleted after the token was issued), return 404 Not Found
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({ message: "Password is incorrect" });
    return;
  }

  // if the new email is the same as the current email, return 400 Bad Request
  if (user.email === newEmail) {
    res
      .status(400)
      .json({ message: "New email must be different from current email" });
    return;
  }

  // update email and save
  user.email = newEmail;
  await user.save();

  // reauthenticate user by generating new tokens
  const { token, refreshToken } = generateTokens(
    user._id.toString(),
    user.email
  );

  // set the new refresh token as an HTTP-only cookie with a 7 day expiration
  setRefreshTokenCookie(res, refreshToken);

  // return the new JWT and updated user info in the response body
  res.status(200).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    message: "Email updated successfully",
  });
};

// logout controller
export const logout = async (req: Request, res: Response) => {
  // frontend clears jwt from local storage, so we need to clear the refresh token on backend
  res.clearCookie("refreshToken");
  res.status(204).send();
};
