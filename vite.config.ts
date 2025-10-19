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
            // Group all React-related packages together (including packages that depend on React)
            if (id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router') ||
                id.includes('framer-motion') ||
                id.includes('react-konva') ||
                id.includes('react-reconciler') ||
                id.includes('scheduler') ||
                id.includes('@radix-ui') ||
                id.includes('@dnd-kit') ||
                id.includes('react-dropzone') ||
                id.includes('react-intersection-observer') ||
                id.includes('react-countup') ||
                id.includes('react-type-animation') ||
                id.includes('sonner') ||
                id.includes('zustand')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('konva') && !id.includes('react-konva')) {
              return 'vendor-konva';
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
