import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Zamonaviy Telegram WebView uchun
    target: 'es2020',

    // Kichik chunklar ogohlantirish chegarasi
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        /**
         * MANUAL CHUNKS — foydalanuvchi faqat kerakli kodni yuklaydi
         *
         * Initial load (Dashboard):  react + trpc + ui + router
         * Lazy load (boshqa sahifalar): faqat navigatsiya qilganda
         */
        manualChunks(id) {
          // React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) return 'chunk-react-core';

          // Router
          if (id.includes('node_modules/wouter')) return 'chunk-router';

          // tRPC + React Query
          if (
            id.includes('node_modules/@trpc/') ||
            id.includes('node_modules/@tanstack/react-query') ||
            id.includes('node_modules/superjson')
          ) return 'chunk-trpc';

          // UI komponentlar (radix + utility classlar + ikonalar)
          if (
            id.includes('node_modules/@radix-ui/') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/lucide-react')
          ) return 'chunk-ui';

          // Form kutubxonalar
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod')
          ) return 'chunk-forms';

          // State management
          if (id.includes('node_modules/zustand')) return 'chunk-state';

          // i18n
          if (
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next')
          ) return 'chunk-i18n';

          // Sana utilitalar
          if (id.includes('node_modules/date-fns')) return 'chunk-date';
        },

        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
  },

  server: {
    port: 5173,
    proxy: {
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@trpc/client',
      '@trpc/react-query',
      '@tanstack/react-query',
    ],
  },
})
