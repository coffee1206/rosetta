import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig((opt) => {
  return {
    root: "src",
    build: {
      outDir: "../dist",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          content_script: resolve(__dirname, "../src/content_script.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          inlineDynamicImports: true,
          format: "iife",
        },
      },
    },
  };
});
