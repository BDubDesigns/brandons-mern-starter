import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { User } from "../models/User.js";

// GET /api/users/me
// Returns the current user's document, creating it on first access.
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    // requireAuth() middleware guarantees userId is present, but we guard anyway
    if (!userId) {
      res.status(401).json({ statusCode: 401, message: "Unauthorized" });
      return;
    }

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // First time this Clerk user hits our API — fetch their email from Clerk
      // and create a local document for app-specific data.
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

      user = await User.create({ clerkId: userId, email });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
