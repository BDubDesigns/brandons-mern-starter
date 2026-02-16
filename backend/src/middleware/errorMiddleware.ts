// Define type guards for MongoDB errors and Mongoose validation errors to improve type safety in the error handling middleware
interface MongoError extends Error {
  code: number;
}

interface ValidationError extends Error {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  stack?: string; // include stack trace in development for debugging
}

// Type guard functions
function isMongoError(err: unknown): err is MongoError {
  return err instanceof Error && "code" in err;
}

function isValidationError(err: unknown): err is ValidationError {
  return (
    err instanceof Error && err.name === "ValidationError" && "errors" in err
  );
}

// error middleware to catch and handle errors in async route handlers
import type { Request, Response, NextFunction } from "express";

// custom error handling middleware that takes an error, request, response, and next function
export default (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500; // default to 500 Internal Server Error
  let message = "Server Error"; // default error message

  // if the error.code is 11000, it's a MongoDB duplicate key error (email already exists)
  if (isMongoError(err) && err.code === 11000) {
    statusCode = 409; // 409 Conflict
    message = "Email already exists";
  }

  // if the error is a Mongoose validation error, extract the validation messages
  else if (isValidationError(err)) {
    statusCode = 400; // 400 Bad Request
    message = Object.values(err.errors)
      .map((error) => error.message)
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
  const response: ErrorResponse = { statusCode, message };
  // Add stack trace in development only
  if (
    process.env.NODE_ENV === "development" &&
    err instanceof Error &&
    err.stack
  ) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
