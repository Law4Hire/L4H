import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'use-sync-external-store'],
  },
  define: {
    '__APP_VERSION__': JSON.stringify('1.0.27-ingress-cors'),
  },
  base: '/',
  build: {
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
          // Vendor chunk for core React libraries and ALL React-dependent libraries
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/use-sync-external-store') ||
              id.includes('node_modules/@dnd-kit') ||
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('shared-ui/src')) {
            return 'vendor-react';
          }
          // Bundle ALL React-dependent libraries together with React to prevent import order issues

          // Other node_modules into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8765',
        changeOrigin: true
      },
      '/gateway': {
        target: 'http://localhost:7070',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8765',
        changeOrigin: true
      },
      '/gateway': {
        target: 'http://localhost:7070',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
