// Mock server setup for testing
import { setupServer } from "msw/node";
// Import the request handlers for the mock server
import { handlers } from "./handlers";
// Create a mock server instance with the request handlers
export const server = setupServer(...handlers);
