import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// VitePWA import disabled - using custom sw.js instead
// import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages deployment base
  base: '/',
  
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  
  plugins: [
    react(),
    // PWA Configuration - DISABLED - using custom sw.js instead
    // VitePWA generates its own service worker which conflicts with our custom one
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: [
    //     'favicon.ico',
    //     'apple-touch-icon.png',
    //     'gonepallogo.png',
    //     'placeholder.svg',
    //     'robots.txt',
    //     'site.webmanifest',
    //     'manifest.json',
    //     'logos/buddha-air.svg',
    //     'logos/tara-air.png',
    //     'logos/yeti-airlines.svg',
    //   ],
    //   manifest: {
    //     name: 'GoNepal - Trekking Companion',
    //     short_name: 'GoNepal',
    //     id: 'gonepal.app',
    //     description: 'Your offline companion for high-altitude Nepal trekking - Explore Everest, temples, wildlife, and culture',
    //     theme_color: '#16a34a',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     start_url: '/',
    //     scope: '/',
    //     lang: 'en',
    //     dir: 'ltr',
    //     categories: ['travel', 'lifestyle', 'sports'],
    //     icons: [
    //       {
    //         src: 'android-chrome-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any',
    //       },
    //       {
    //         src: 'android-chrome-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any',
    //       },
    //       {
    //         src: 'apple-touch-icon.png',
    //         sizes: '180x180',
    //         type: 'image/png',
    //         purpose: 'any maskable',
    //       },
    //     ],
    //   },
    // }),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
          ],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-offline': ['dexie', 'localforage', 'leaflet.offline'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
  
  prefetchStrategy: 'viewport',
}));
