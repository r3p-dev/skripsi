import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    inertia({ ssr: { enabled: false, entrypoint: 'inertia/ssr.tsx' } }),
    adonisjs({ entrypoints: ['inertia/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '@/generated': `${import.meta.dirname}/.adonisjs/client/`,
      /**
       * The enums are shared with the server rather than mirrored here.
       *
       * Every status, type and role now travels as its stored value, so the
       * page is the thing that turns one into Indonesian — and a second copy
       * of those label maps living under `inertia/` would drift from the
       * server's the first time anybody added a status. They are plain
       * constants with no server imports, so they bundle cleanly.
       */
      '@/enums': `${import.meta.dirname}/app/enums/`,
      '@/': `${import.meta.dirname}/inertia/`,
    },
  },

  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
