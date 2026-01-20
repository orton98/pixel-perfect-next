import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isSingleFile = mode === "singlefile";
  const isPortable3Files = mode === "portable";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // 1) True single-file export (dist/index.html contains everything)
      isSingleFile && viteSingleFile(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // 2) Portable export as exactly 3 files: dist/index.html + dist/app.js + dist/style.css
    build: isPortable3Files
      ? {
          cssCodeSplit: false,
          assetsInlineLimit: 0,
          sourcemap: false,
          rollupOptions: {
            output: {
              // one JS bundle
              inlineDynamicImports: true,
              entryFileNames: "app.js",
              chunkFileNames: "app.js",
              // one CSS bundle
              assetFileNames: (assetInfo) => {
                if (assetInfo.name && assetInfo.name.endsWith(".css")) return "style.css";
                return "[name][extname]";
              },
            },
          },
        }
      : undefined,
  };
});

