// JWT payload structure used for token generation and verification
export interface JWTPayload {
  userId: string;
  email: string;
}

// Field validation error structure (matches express-validator format)
export interface FieldError {
  type: "field";
  msg: string;
  path: string;
  location: "body" | "params" | "query";
}

// User data returned in API responses (no password)
export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
