import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['@l4h/shared-ui'],
    },
    resolve: {
      preserveSymlinks: true,
      dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'use-sync-external-store'],
    },
    define: {
      '__APP_VERSION__': JSON.stringify(new Date().toISOString()),
    },
    base: '/',
    build: {
    minify: false,
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunks for better code-splitting and caching
        manualChunks: (id) => {
          // Vendor chunk for core React libraries and React-dependent UI libraries
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/use-sync-external-store')) {
            return 'vendor-react';
          }
          // Separate chunk for @tanstack/react-query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Shared UI library as separate chunk
          if (id.includes('@l4h/shared-ui')) {
            return 'shared-ui';
          }
          // Other node_modules into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
}});
