import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "ignore-sourcemap-requests",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith(".map")) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      },
    },
    reactRouter(),
  ],
  css: {
    devSourcemap: false,
  },
});
