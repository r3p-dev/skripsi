import env from '#start/env'

export const osrm = {
  enabled: env.get('OSRM_ENABLED', false),

  baseUrl: env.get('OSRM_URL', 'http://127.0.0.1:5000'),

  profile: env.get('OSRM_PROFILE', 'driving'),

  timeoutMs: env.get('OSRM_TIMEOUT_MS', 3000),

  maxTableSize: env.get('OSRM_MAX_TABLE_SIZE', 100),
} as const
