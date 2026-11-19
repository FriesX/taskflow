/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|scheduler)/ },
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore/ },
            { name: 'firebase-auth', test: /node_modules[\\/](firebase|@firebase)/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory-)/ },
            { name: 'dnd', test: /node_modules[\\/]@dnd-kit/ },
            { name: 'i18n', test: /node_modules[\\/](i18next|react-i18next)/ },
          ],
        },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
