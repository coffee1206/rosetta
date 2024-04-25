import path from "path";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig((opt) => {
  return {
    root: "src",
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(__dirname, "src/manifest.json"),
            dest: "./",
          },
          {
            src: path.resolve(__dirname, "src/images/*"),
            dest: "./images",
          },
        ],
      }),
    ],
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "src/popup.html"),
          option: resolve(__dirname, "src/option/option.html"),
        },
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
  };
});
