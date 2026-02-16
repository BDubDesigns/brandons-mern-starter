import type { FieldError } from "../types/index.js";

// Utility function to create a standardized field error object
export function createFieldError(field: string, message: string): FieldError {
  return {
    type: "field", // indicates this is a field-specific error
    msg: message,
    path: field, // the field that caused the error, e.g. "email" or "password"
    location: "body",
  };
}
