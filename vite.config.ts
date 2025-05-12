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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
            'react-virtualized',
            'react-window'
          ]
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    copyPublicDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'index.html'),
      formats: ['es'],
      fileName: () => 'index.html'
    }
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
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'top-level-await': true
      },
    }
  },
}) 