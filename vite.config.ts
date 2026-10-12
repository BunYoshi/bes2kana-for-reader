import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/bes2kana-for-reader/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // License pages are standalone documents; do not send them to the SPA fallback.
        navigateFallbackDenylist: [/^\/LICENSE\.txt$/]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    cssMinify: 'esbuild'
  },
  optimizeDeps: {
    include: ['tenji']
  }
})
