import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("MongoDB connected");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("MongoDB connection error:", errorMessage);
    process.exit(1);
  }
};

export default connectDB;
