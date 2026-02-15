import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    passWithNoTests: true,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://moviedig:moviedig_dev@localhost:5432/moviedig_dev",
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || "test-secret-key-for-vitest",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    conditions: ["node", "import"],
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },
});
