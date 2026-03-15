import mongoose from "mongoose";

// Minimal User document — clerkId is the primary link to Clerk's identity.
// Add app-specific fields here as your project requires.
const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
