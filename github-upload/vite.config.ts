import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rolldownOptions: {
              // 네이티브 모듈은 번들하지 않고 node_modules에서 로드
              external: ['uiohook-napi'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
      },
    }),
  ],
  build: {
    rolldownOptions: {
      input: {
        main: path.resolve(rootDir, 'index.html'),
        settings: path.resolve(rootDir, 'settings.html'),
      },
    },
  },
})
