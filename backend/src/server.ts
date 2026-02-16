// import and configure .env vars
import "dotenv/config";
import express from "express";

// import cors to allow cross-origin requests from the frontend
import cors from "cors";

//import cookie parser to parse cookies in incoming requests, needed for refresh token handling
import cookieParser from "cookie-parser";

// import auth middleware to protect routes
// import { verifyJWT } from "./middleware/authMiddleware.js";

// import error middleware to handle errors in a centralized way
import errorMiddleware from "./middleware/errorMiddleware.js";

// import connectDB to connect to mongoDB
import connectDB from "./config/db.js";

// import auth routes to handle authentication-related endpoints
import authRoutes from "./routes/authRoutes.js";

// set PORT from env vars or default to 5001 and parse it as an integer for ts
const PORT = parseInt(process.env.PORT || "5001", 10);

// create express app and use cors, and json middleware to parse incoming requests
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend origin that's allowed to send credentials
    credentials: true, // Allow cookies/credentials from that origin
  }),
);
app.use(express.json());
// use cookie parser middleware to parse cookies in incoming requests, needed for refresh token handling
app.use(cookieParser());

// define a test route to verify the server is working
app.get("/api/health", (req, res) => {
  res.status(200).json({ statusCode: 200, message: "Server is healthy" });
});

// use auth routes for all /api/auth endpoints
app.use("/api/auth", authRoutes);

// use error middleware after all routes to catch any errors that occur in route handlers
app.use(errorMiddleware);

// wrap server start in an async function to handle async db connection and catch any errors
async function startServer() {
  try {
    // connect to MongoDB before starting the server
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    // handle any errors that occur during startup, such as db connection failures
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to start server:", errorMessage);
    process.exit(1);
  }
}

startServer();
