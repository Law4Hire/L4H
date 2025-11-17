import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
          // Vendor chunk for core React libraries
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
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
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
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
  }
})
