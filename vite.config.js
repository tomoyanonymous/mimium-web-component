import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    topLevelAwait(),
    dts({ tsconfigPath: "./tsconfig.json" }),
    checker({ typescript: true }),
  ],
  assetsInclude:["node_modules/@mimium/mimium-webaudio/dist/assets/**"],
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "mimium_web_component",
      formats: ["iife"],

      fileName: () => "mimium-web-component.js",
    },
    sourcemap: true,
  },
  rollupOptions: {
    external: ["mimium-webaudio"],
    output: {
      // 外部化された依存関係のために UMD のビルドで使用する
      // グローバル変数を提供します
      globals: {
        mimium_webaudio: "setupAudioWorklet",
      },
    },
  },
  optimizeDeps: {
    include: ["@mimium/mimium-webaudio"],
  },
});
