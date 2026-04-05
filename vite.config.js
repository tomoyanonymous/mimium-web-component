import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import path from "node:path";
import dts from "vite-plugin-dts";
import checker from "vite-plugin-checker";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const mimiumDistDir = path.resolve("node_modules/@mimium/mimium-webaudio/dist");
const processorFile = "audioprocessor.mjs";

async function collectMimiumWorkletFiles() {
  const files = new Map();
  const processorPath = path.join(mimiumDistDir, processorFile);
  const processorSource = await readFile(processorPath, "utf8");
  files.set(processorFile, Buffer.from(processorSource));

  const importMatches = [
    ...processorSource.matchAll(/import\s+[^"']*["']\.\/([^"']+)["']/g),
  ];
  const dependencies = [...new Set(importMatches.map((m) => m[1]))];

  await Promise.all(
    dependencies.map(async (fileName) => {
      const filePath = path.join(mimiumDistDir, fileName);
      files.set(fileName, await readFile(filePath));
    }),
  );

  return files;
}

function mimiumWorkletAssetsPlugin() {
  return {
    name: "mimium-worklet-assets",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/assets", async (req, res, next) => {
        try {
          const reqPath = req.url?.split("?")[0] ?? "";
          const fileName = reqPath.replace(/^\//, "");
          if (!fileName) {
            return next();
          }

          const files = await collectMimiumWorkletFiles();
          const content = files.get(fileName);
          if (!content) {
            return next();
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.end(content);
        } catch {
          next();
        }
      });
    },
  };
}

function mimiumWorkletAssetsBuildPlugin() {
  return {
    name: "mimium-worklet-assets-build",
    apply: "build",
    async generateBundle() {
      const files = await collectMimiumWorkletFiles();
      for (const [fileName, source] of files.entries()) {
        this.emitFile({
          type: "asset",
          fileName: `assets/${fileName}`,
          source,
        });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    mimiumWorkletAssetsPlugin(),
    mimiumWorkletAssetsBuildPlugin(),
    topLevelAwait(),
    dts({ tsconfigPath: "./tsconfig.json" }),
    checker({ typescript: true }),
    // Inject extracted CSS into the JS bundle so consumers don't need a
    // separate <link> tag. Monaco's layout CSS (position:absolute etc.) must
    // be present in document.head for the editor to render correctly.
    cssInjectedByJsPlugin(),
  ],
  assetsInclude: ["node_modules/@mimium/mimium-webaudio/dist/assets/**"],
  build: {
    minify: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "mimium_web_component",
      formats: ["es"],
      fileName: () => "mimium-web-component.js",
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        // Ensure Monaco workers are properly chunked 
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ["@mimium/mimium-webaudio", "monaco-editor"],
  },
});
