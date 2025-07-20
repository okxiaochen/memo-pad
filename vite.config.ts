import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: './src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/renderer/dashboard.html'),
        'note-quill': resolve(__dirname, 'src/renderer/note-quill.html'),
      },
      output: {
        manualChunks: undefined,
      },
      treeshake: false,
    },
    minify: 'esbuild',
    target: 'esnext',
  },
  server: {
    port: 5177,
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
}) 