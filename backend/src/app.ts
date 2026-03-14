import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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
