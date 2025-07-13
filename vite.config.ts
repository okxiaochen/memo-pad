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
        note: resolve(__dirname, 'src/renderer/note-react.html'),
      },
    },
  },
  server: {
    port: 5177,
  },
}) 