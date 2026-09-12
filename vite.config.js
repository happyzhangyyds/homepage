import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { createHtmlPlugin } from "vite-plugin-html";
import { resolve } from "path";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            logo: env.VITE_SITE_LOGO,
            appleLogo: env.VITE_SITE_APPLE_LOGO,
            title: env.VITE_SITE_NAME,
            author: env.VITE_SITE_ANTHOR,
            keywords: env.VITE_SITE_KEYWORDS,
            description: env.VITE_SITE_DES,
            tongji: env.VITE_SITE_BAIDUTONGJI,
          },
        },
      }),
    ],
    server: { port: 3000, hmr: true },
    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
  });
};
