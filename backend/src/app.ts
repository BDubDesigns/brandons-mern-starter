import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (health checks, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Regex that matches Vercel preview URLs for the specific project
      const previewRegex =
        /^https:\/\/[a-zA-Z0-9-]+-bdubdesigns-projects\.vercel\.app$/;
      const isPreview = previewRegex.test(origin);

      // Exact match for the configured production frontend URL
      const isProduction = origin === process.env.FRONTEND_URL;

      // Optional: allow localhost during development
      const isLocalDev =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/localhost:\d+$/.test(origin);

      if (isPreview || isProduction || isLocalDev) {
        callback(null, true); // allow
      } else {
        callback(new Error("Not allowed by CORS")); // block
      }
    },
    credentials: true,
  }),
);
app.use(clerkMiddleware());
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_, res) => {
  res.status(200).json({ statusCode: 200, message: "Server is healthy" });
});

app.use(errorMiddleware);

export default app;
