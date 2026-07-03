import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: everything (JS + CSS) is inlined into dist/index.html
// so the final page works by double-clicking the file — no server required.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    target: 'es2018',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 6000,
    reportCompressedSize: false
  }
})
