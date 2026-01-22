// import Schema and model from mongoose to define our User schema and model
import { Schema, model } from "mongoose";
// import Document type for TypeScript to define the User interface
import type { Document } from "mongoose";
// import bcrypt for hashing passwords before saving to the database
import bcrypt from "bcrypt";

// define an interface for the User document that extends mongoose's Document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  createdAt: Date; // createdAt and updatedAt will be automatically added by Mongoose when we set timestamps: true in the schema options
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updatePassword(newPassword: string): Promise<void>;
}

// define the User schema with the fields and their types, and set
// timestamps to true to automatically add createdAt and updatedAt fields
export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// pre-save middleware to hash the password before saving the user document
UserSchema.pre<IUser>("save", async function () {
  // early return if the password field has not been modified to avoid re-hashing an already hashed password
  if (!this.isModified("password")) return;

  // hash the password with a salt round of 10 and set it back to the password field
  this.password = await bcrypt.hash(this.password, 10);
});

// comparePassword() method to compare a plain text password with the hashed password stored in the database
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// updatePassword() method to update the user's password using save() to trigger the pre-save middleware for hashing
// IMPORTANT: We don't use findByIdAndUpdate() here because query operations (findByIdAndUpdate, findByIdAndRemove, etc.)
// bypass Mongoose middleware hooks. If we used findByIdAndUpdate({ password: newPassword }), the pre-save hook
// wouldn't run, and the password would be saved plain-text to the database.
// By explicitly calling .save(), we guarantee the pre-save hook runs and hashes the password.
UserSchema.methods.updatePassword = async function (
  newPassword: string
): Promise<void> {
  this.password = newPassword;
  await this.save();
};

// create and export the User model based on the UserSchema
export default model<IUser>("User", UserSchema);
