import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@sonth87/device-layout')) {
              return 'vendor-layout';
            }
            return 'vendor-core';
          }
          if (id.includes('/src/data/curriculum/')) {
            return 'data-curriculum';
          }
          if (id.includes('/src/data/glossary/')) {
            return 'data-glossary';
          }
          if (id.includes('/src/data/practice/')) {
            return 'data-practice';
          }
          if (
            id.includes('/src/data/flashcards/') ||
            id.includes('/src/data/exams/')
          ) {
            return 'data-assessments';
          }
        },
      },
    },
  },
});
