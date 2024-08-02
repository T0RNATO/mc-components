import { defineConfig } from "vite";
import path from "path";
import vuePlugin from "@vitejs/plugin-vue";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vuePlugin()],
});