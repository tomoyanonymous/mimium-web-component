import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import checker from "vite-plugin-checker";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  base: "./",
  plugins: [
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
