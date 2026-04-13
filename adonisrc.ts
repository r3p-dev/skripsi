import { indexPages } from '@adonisjs/inertia'
import { indexEntities } from '@adonisjs/core'
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  experimental: {},

  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/session/commands'),
    () => import('@adonisjs/inertia/commands'),
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/vite/vite_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/inertia/inertia_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
    () => import('@adonisjs/drive/drive_provider'),
    () => import('@adonisjs/i18n/i18n_provider'),
    () => import('@adonisjs/transmit/transmit_provider'),
    () => import('@adonisjs/limiter/limiter_provider'),
  ],

  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/validator'),
  ],

  tests: {
    suites: [
      {
        files: ['tests/unit/**/*.spec.{ts,js}'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['tests/functional/**/*.spec.{ts,js}'],
        name: 'functional',
        timeout: 30000,
      },
      {
        files: ['tests/browser/**/*.spec.{ts,js}'],
        name: 'browser',
        timeout: 300000,
      },
    ],
    forceExit: false,
  },

  metaFiles: [
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
    {
      pattern: 'public/**',
      reloadServer: false,
    },
    {
      pattern: 'resources/lang/**/*.{json,yaml,yml}',
      reloadServer: false,
    },
  ],

  hooks: {
    init: [
      indexEntities({
        transformers: { enabled: true, withSharedProps: true },
      }),
      indexPages({ framework: 'react' }),
      generateRegistry(),
    ],
    buildStarting: [() => import('@adonisjs/vite/build_hook')],
  },
})
