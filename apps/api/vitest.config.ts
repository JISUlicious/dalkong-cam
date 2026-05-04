import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@dalkong/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
    },
  },
});
