import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),
  DRIVE_DISK: Env.schema.enum(['fs'] as const),
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.secret(),
  DB_DATABASE: Env.schema.string(),

  MIDTRANS_MERCHANT_ID: Env.schema.secret(),
  MIDTRANS_SERVER_KEY: Env.schema.secret(),

  FONNTE_API_KEY: Env.schema.secret(),

  OSRM_ENABLED: Env.schema.boolean.optional(),
  OSRM_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  OSRM_PROFILE: Env.schema.string.optional(),

  OVERPASS_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  OSRM_TIMEOUT_MS: Env.schema.number.optional(),
  OSRM_MAX_TABLE_SIZE: Env.schema.number.optional(),
})
