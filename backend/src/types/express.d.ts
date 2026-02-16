import type { JWTPayload } from "./index.ts";
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
