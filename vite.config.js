import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
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
})