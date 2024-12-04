import { resolve } from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
    build: {
        target: "esnext",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                client: resolve(__dirname, "client.html"),
            },
        },
    },
})
