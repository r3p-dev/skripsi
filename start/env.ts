/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  /*
  |----------------------------------------------------------
  | Variables for configuring the Node.js environment
  |----------------------------------------------------------
  */
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the application
  |----------------------------------------------------------
  */
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  /*
  |----------------------------------------------------------
  | Variables for configuring the session
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.secret(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the Midtrans package
  |----------------------------------------------------------
  */
  MIDTRANS_MERCHANT_ID: Env.schema.secret(),
  MIDTRANS_SERVER_KEY: Env.schema.secret(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the Fonnte connection
  |----------------------------------------------------------
  */
  FONNTE_API_KEY: Env.schema.secret(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the OSRM road router
  |----------------------------------------------------------
  |
  | All optional: with none of them set the app plans routes from
  | straight-line distances, which is what it did before OSRM existed.
  |
  */
  OSRM_ENABLED: Env.schema.boolean.optional(),
  OSRM_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  OSRM_PROFILE: Env.schema.string.optional(),
  OSRM_TIMEOUT_MS: Env.schema.number.optional(),
  OSRM_MAX_TABLE_SIZE: Env.schema.number.optional(),
})
