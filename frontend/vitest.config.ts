import path from 'path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Config distincte de `vite.config.ts` : celle-ci n'embarque pas `vite-plugin-vuetify`, qui
// compile `settings.scss` à chaque démarrage. Inutile ici — Vitest ne traite pas le CSS et les
// tests de composants montent Vuetify à la main.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.spec.ts', 'src/test/**', 'src/main.ts'],
    },
  },
})
