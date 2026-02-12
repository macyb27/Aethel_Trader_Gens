import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
