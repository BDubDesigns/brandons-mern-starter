// Field validation error structure (matches express-validator format)
export interface FieldError {
  type: "field";
  msg: string;
  path: string;
  location: "body" | "params" | "query";
}
