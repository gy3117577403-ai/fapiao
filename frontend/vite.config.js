import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const githubPagesBase = process.env.VITE_BASE_PATH || "/fapiao/";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? githubPagesBase : process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
