import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach, vi } from "vitest";

// declare mongoServer at module scope so both beforeAll and afterAll can reference the same instance
let mongoServer: MongoMemoryServer;

// before any test in the suite runs, spins up a fresh in-memory MongoDB process
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  vi.stubEnv("JWT_SECRET", "secret-123");
});

// after each test, delete every collection
afterEach(async () => {
  // clear all collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

// once all tests are complete, close the mongoose connection, then shutdown mongo, cleaning up memory and processes
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
