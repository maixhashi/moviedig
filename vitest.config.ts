import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://moviedig:moviedig_dev@localhost:5432/moviedig_dev",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
