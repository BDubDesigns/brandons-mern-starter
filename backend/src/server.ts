// import and configure .env vars here so tests importing app.ts don't load .env
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = parseInt(process.env.PORT || "5001", 10);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to start server:", errorMessage);
    process.exit(1);
  }
}

startServer();
