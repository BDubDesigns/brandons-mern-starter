import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// extend the Express Request interface to include a user property for TypeScript type safety
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// authMiddleware function to verify JWT tokens and protect routes
export const verifyJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // get the token from the Authorization header
  const authHeader = req.headers.authorization;
  // check if the token is present and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // if no token is provided, return 401 Unauthorized
    res.status(401).json({ message: "Missing or invalid auth header" });
    return;
  }

  // extract the token from the header (the part after "Bearer ")
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }
  // get the JWT secret from environment variables
  const secret = process.env.JWT_SECRET;
  // if the secret is not defined, log an error and return 500 Server Error
  if (!secret) {
    console.log("JWT_SECRET is not defined in environment variables");
    res.status(500).json({ message: "Server error" });
    return;
  }

  // verify the token using jwt.verify, which will throw an error if the token is invalid or expired
  try {
    // if the token is valid, jwt.verify will return the decoded payload, which we can attach to req.user for use in protected routes
    const decoded = jwt.verify(token, secret);

    // Validate the payload has the required properties
    if (
      !decoded ||
      typeof decoded === "string" ||
      !("userId" in decoded) ||
      !("email" in decoded)
    ) {
      // If the payload is missing required properties, return 401 Unauthorized
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    req.user = decoded as { userId: string; email: string };
    next();
  } catch (error) {
    // if the token is invalid or expired, return 401 Unauthorized
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};
