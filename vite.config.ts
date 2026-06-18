import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: {
        clientPort: 3000,
        overlay: false,
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn'],
        },
      },
      assetsInlineLimit: 0,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // xlsx — admin only, very heavy
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-admin';
            }
            // Supabase
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            // Radix UI
            if (id.includes('node_modules/@radix-ui')) {
              return 'vendor-ui';
            }
            // i18next — split out of main bundle
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'vendor-i18n';
            }
            // react-router
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // react-helmet-async
            if (id.includes('node_modules/react-helmet-async')) {
              return 'vendor-router';
            }
            // communes data — only used in Checkout, keep it there (already lazy)
            // lucide-react — tree-shaken per page, don't bundle together
          },
        },
      },
    },
  };
});
