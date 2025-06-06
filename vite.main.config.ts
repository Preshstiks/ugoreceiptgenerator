import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist/main",
    lib: {
      entry: {
        main: resolve(__dirname, "src/electron/main.ts"),
        preload: resolve(__dirname, "src/electron/preload.ts"),
      },
      formats: ["cjs"],
      fileName: (format, entryName) => `${entryName}.cjs`,
    },
    rollupOptions: {
      external: ["electron"],
      output: {
        entryFileNames: "[name].cjs",
      },
    },
  },
});
