import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * Fixes pre-bundled Rolldown CJS `require("react")` calls inside `@sonth87/device-layout`
 * by resolving `"react"` and `"react-dom"` to the module's existing ESM imports.
 */
function fixRolldownCjsRequire(): Plugin {
  return {
    name: 'fix-rolldown-cjs-require',
    enforce: 'pre',
    transform(code, id) {
      if (
        id.includes('@sonth87/device-layout') &&
        code.includes('rolldown.rs/in-depth/bundling-cjs#require-external-modules')
      ) {
        const target =
          'function(e) {\n\tif (typeof require < "u") return require.apply(this, arguments);\n\tthrow Error("Calling `require` for \\"" + e + "\\"';
        const replacement =
          'function(mod) {\n\tif (mod === "react") return e;\n\tif (mod === "react-dom") return a;\n\tif (typeof require < "u") return require.apply(this, arguments);\n\tthrow Error("Calling `require` for \\"" + mod + "\\"';
        if (code.includes(target)) {
          return {
            code: code.replace(target, replacement),
            map: null,
          };
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [fixRolldownCjsRequire(), react(), tailwindcss()],
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
              // Let Vite preserve @sonth87/device-layout's internal lazy chunks
              return undefined;
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
          if (id.includes('/src/data/samples/')) {
            return 'data-samples';
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
