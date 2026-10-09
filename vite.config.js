import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// One id per build. The app compares it with /version.json (fetched uncached) to notice
// a newer deploy, because GitHub Pages lets browsers cache index.html for 10 minutes.
const BUILD_ID = Date.now().toString(36)

export default defineConfig({
  base: '/Coupons/',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'version-file',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: BUILD_ID }) })
      },
    },
  ],
})
