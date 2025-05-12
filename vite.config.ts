import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Plugin to handle Flow directives
const flowPlugin = {
  name: 'flow-directive-handler',
  transform(code, id) {
    if (id.includes('react-virtualized')) {
      return {
        code: code.replace(/\/\/\s*@flow.*$/gm, ''),
        map: null
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), flowPlugin],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  assetsInclude: ['**/*.proto'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'table-vendor': ['@tanstack/react-table', '@tanstack/react-virtual'],
          'virtualized-vendor': ['react-virtualized', 'react-window'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      'react-virtualized',
      'react-window',
    ],
  },
}) 