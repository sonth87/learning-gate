import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

const ROLLDOWN_CJS_TARGET =
  'function(e) {\n\tif (typeof require < "u") return require.apply(this, arguments);\n\tthrow Error("Calling `require` for \\"" + e + "\\"';
const ROLLDOWN_CJS_REPLACEMENT =
  'function(mod) {\n\tif (mod === "react") return e;\n\tif (mod === "react-dom") return a;\n\tif (typeof require < "u") return require.apply(this, arguments);\n\tthrow Error("Calling `require` for \\"" + mod + "\\"';

function patchRolldownRequireSource(code: string): string | null {
  if (
    code.includes('rolldown.rs/in-depth/bundling-cjs#require-external-modules') &&
    code.includes(ROLLDOWN_CJS_TARGET)
  ) {
    return code.replace(ROLLDOWN_CJS_TARGET, ROLLDOWN_CJS_REPLACEMENT);
  }
  return null;
}

/**
 * Fixes pre-bundled Rolldown CJS `require("react")` calls inside `@sonth87/device-layout`
 * in both Rollup production builds (`vite build`) and `esbuild` dev pre-bundling (`localhost`).
 */
function fixRolldownCjsRequire(): Plugin {
  return {
    name: 'fix-rolldown-cjs-require',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('@sonth87/device-layout')) {
        const patched = patchRolldownRequireSource(code);
        if (patched) {
          return { code: patched, map: null };
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [fixRolldownCjsRequire(), react(), tailwindcss()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'fix-rolldown-cjs-require-esbuild',
          setup(build) {
            build.onLoad({ filter: /@sonth87[\\/]device-layout[\\/].*\.js$/ }, async (args) => {
              const source = await fs.promises.readFile(args.path, 'utf8');
              const patched = patchRolldownRequireSource(source);
              if (patched) {
                return { contents: patched, loader: 'js' };
              }
              return undefined;
            });
          },
        },
      ],
    },
  },
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
