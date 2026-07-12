import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/ai/model.ts",
        "src/ai/stream.ts",
        "src/ai/validation.ts",
        "src/ai/citations.ts",
        "src/ai/data.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
