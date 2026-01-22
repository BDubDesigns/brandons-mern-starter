// error middleware to catch and handle errors in async route handlers
import type { Request, Response, NextFunction } from "express";

// custom error handling middleware that takes an error, request, response, and next function
export default (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500; // default to 500 Internal Server Error
  let message = "Server Error"; // default error message

  // if the error.code is 11000, it's a MongoDB duplicate key error (email already exists)
  if (err instanceof Error && "code" in err && err.code === 11000) {
    statusCode = 409; // 409 Conflict
    message = "Email already exists";
  }

  // if the error is a Mongoose validation error, extract the validation messages
  else if (
    err instanceof Error &&
    "name" in err &&
    err.name === "ValidationError"
  ) {
    statusCode = 400; // 400 Bad Request
    message = Object.values((err as any).errors)
      .map((error: any) => error.message)
      .join(", ");
  }
  // JWT error
  else if (
    err instanceof Error &&
    "name" in err &&
    err.name === "JsonWebTokenError"
  ) {
    // JWT errors indicate invalid tokens, so we set status to 401 Unauthorized
    statusCode = 401;
    message = "Invalid token";
  }

  // for any other errors, we can check if it's an instance of Error and use its message, otherwise convert it to a string
  else if (err instanceof Error) {
    message = err.message;
  } else {
    message = String(err);
    // we already set the status code to 500
  }

  // build response object
  const response: any = { statusCode, message };
  // Add stack trace in development only
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
