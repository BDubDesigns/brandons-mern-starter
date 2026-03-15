import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
    env: {
      NODE_ENV: "test",
    },
  },
});
