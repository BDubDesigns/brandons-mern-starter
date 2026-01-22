# TypeScript & Architecture Patterns Reference

**Purpose**: A living reference guide documenting patterns, concepts, and architectural decisions that required deep explanation during development. Use this to review patterns, understand the "why" behind decisions, debug similar issues faster, and avoid re-learning concepts.

**Format:**

- **Concept Name** — Clear, searchable title
- **The Problem** — What scenario requires this pattern
- **The Solution** — How to implement it
- **Code Examples** — Complete, runnable examples
- **When to Use** — Decision criteria
- **Why It Matters** — Interview/professional context

---

## Interface Patterns: Creating vs Augmenting

### **Pattern 1: Creating a New Interface (Your Own Type)**

**The Problem:**
You need to define a custom type for a new data structure (like a database model) that doesn't exist in any library.

**The Solution:**
Create an interface as a standalone type definition.

**Code Example:**

```typescript
// models/User.ts
import { Document } from "mongoose";

// This is YOUR interface for your data
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
}

// You control this type completely
export const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  // ...
});
```

**When to Use:**

- Defining schemas, models, or data structures you own
- Creating API response types
- Defining function return types
- Any type that represents YOUR application's concepts

**Why It Matters:**
Clean, explicit types make your codebase readable and prevent naming conflicts.

---

### **Pattern 2: Augmenting an Existing Library Type (Type Merging)**

**The Problem:**
A library (like Express) exports a type, but it doesn't have a property you need. You can't modify the library directly, but you want TypeScript to recognize your custom property everywhere that type is used.

**The Solution:**
Use `declare global` and `namespace` to merge your properties into the existing type.

**Code Example:**

```typescript
// middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";

// Augment (extend) Express's Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// Now EVERYWHERE in the app where Request is used, it has a 'user' property
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  // TypeScript knows req.user exists (optional property)
  req.user = { userId: "123", email: "test@example.com" };
  next();
};

// In another middleware:
export const someOtherMiddleware = (req: Request) => {
  console.log(req.user?.email); // ✅ Works everywhere
};
```

**When to Use:**

- Adding custom properties to library types (Express Request, Response, etc.)
- Extending third-party library types without forking them
- When you need a property to be recognized globally across your app

**Why It Matters:**

- **Global availability:** Once declared, every middleware and route handler automatically knows about `req.user`
- **Type safety:** TypeScript prevents you from accessing properties that don't exist
- **Professional pattern:** This is how real production apps extend libraries

---

### **Pattern 3: Creating an Extended Interface (Alternative to Augmenting)**

**The Problem:**
You want a custom Request type, but you don't want to pollute the global namespace.

**The Solution:**
Extend the library type into a new interface, but only use it where needed.

**Code Example:**

```typescript
// types/index.ts
import type { Request } from "express";

// Create YOUR OWN extended Request type
export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

// middleware/authMiddleware.ts
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";

// Only THIS middleware uses AuthRequest
export const verifyJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  req.user = { userId: "123", email: "test@example.com" };
  next();
};

// But OTHER middleware still uses the base Request type
export const someOtherMiddleware = (req: Request) => {
  // req.user doesn't exist here ❌
  // TypeScript catches this error
};
```

**When to Use:**

- Only specific middleware or routes need the custom property
- You want to be explicit about which functions have access to `req.user`
- Keeping concerns separated (not all routes are authenticated)

**Why It Matters:**

- **Explicit:** It's obvious which middleware handles authentication
- **Type-safe:** Unauthenticated routes can't accidentally use `req.user`
- **Less global pollution:** Doesn't modify the global Express type

---

### **Quick Decision Guide**

| Scenario                                 | Pattern                     | Example                                     |
| ---------------------------------------- | --------------------------- | ------------------------------------------- |
| Define a new data model                  | Pattern 1: Create interface | `interface IUser { }`                       |
| Add property to Express Request globally | Pattern 2: Augment          | `declare global { namespace Express { } }`  |
| Add property to Express Request locally  | Pattern 3: Extend           | `interface AuthRequest extends Request { }` |
| Create a custom API response type        | Pattern 1: Create interface | `interface ApiResponse { }`                 |

---

### **Real-World Example: Why We Use Pattern 2 in This Project**

In `backend/src/middleware/authMiddleware.ts`, we use **Pattern 2** because:

1. **All middleware needs it** — Login, refresh, protected routes all need to know about `req.user`
2. **All routes need it** — Any route handler should be able to access `req.user`
3. **Global availability** — Once declared, it's available everywhere without importing types

If we used **Pattern 3**, we'd have to:

- Import `AuthRequest` in every middleware
- Import `AuthRequest` in every route handler
- Type every single request handler manually
- Risk inconsistency if someone forgets to use `AuthRequest`

**Pattern 2 is cleaner and safer for auth.**

---

## Key Takeaway

- **Creating** an interface = defining a new type from scratch
- **Augmenting** a type = adding properties to an existing library type
- Use augmentation when the property needs to be available everywhere
- Use extension when the property is only needed in specific places
