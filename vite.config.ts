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
      // Brotli compression — highest compression ratio, served by Cloudflare Pages
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024, // only compress files > 1KB
      }),
      // Gzip as fallback for older browsers/CDNs
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
      // Use terser for smaller output (removes console.log in prod)
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn'],
        },
      },
      // Don't inline small assets as base64 — let the browser cache them
      assetsInlineLimit: 0,
      // Split CSS per chunk for better caching
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          /**
           * Manual chunk splitting — key for mobile performance.
           * Without this, ALL code ships in one big bundle on first load.
           * With this: homepage loads only homepage code, admin loads only when needed.
           * Pattern: group by library category so each has its own cache entry.
           */
          manualChunks(id) {
            // Admin-only heavy libraries (recharts, xlsx) — never loaded on store pages
            if (id.includes('recharts') || id.includes('xlsx')) {
              return 'vendor-admin-charts';
            }
            // Supabase client — separate so it caches independently
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // React core — most stable, longest cache
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // All other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});
