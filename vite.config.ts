import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 6000000
      },
      includeAssets: ['favicon.svg', 'robots.txt', 'pwa/*.svg'],
      manifest: {
        name: 'Echoes',
        short_name: 'Echoes',
        description: 'A private, beautiful, and intelligent space to capture life moments.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@emotion/react', '@emotion/styled', 'lucide-react'],
          'vendor-tf': ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
          'vendor-utils': ['date-fns', 'jspdf', 'html-to-image', 'leaflet', 'react-leaflet']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://traem2c66pq6.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})