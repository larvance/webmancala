import {defineConfig} from "vite";
import path from "path";

export default defineConfig({
    base: "./",
    server: {
        host: "127.0.0.1",
        port: 1923
    },
    build: {
        assetsInlineLimit: 0,
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"),
            output: {
                assetFileNames: "assets/[name]-[hash][extname]"
            }
        }
    },
    worker: {
        format: "es"
    }
});