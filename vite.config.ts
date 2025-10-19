import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('konva')) {
              return 'vendor-konva';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // All other node_modules
            return 'vendor';
          }

          // Feature chunks
          if (id.includes('/src/features/canvas-core') ||
              id.includes('/src/features/layers-panel') ||
              id.includes('/src/features/properties-panel')) {
            return 'features-canvas';
          }
          if (id.includes('/src/features/collaboration')) {
            return 'features-collab';
          }
          if (id.includes('/src/features/ai-agent')) {
            return 'features-ai';
          }
        },
      },
    },
  },
})
