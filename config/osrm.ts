import env from '#start/env'

/**
 * Where the road router lives and how far the app will wait for it.
 *
 * OSRM is a self-hosted service, so there is no API key and no quota here:
 * the only limits that matter are the ones this machine imposes. It is
 * deliberately reachable on a private address only — see OSRM.md for why it
 * must never be published through Caddy.
 */
export const osrm = {
  /**
   * Whether route planning is allowed to ask OSRM at all.
   *
   * Off by default so a checkout without a router running still boots and
   * still plans routes, just with straight-line distances. Turning it on is
   * a deployment decision, not a code change.
   */
  enabled: env.get('OSRM_ENABLED', false),

  /**
   * Base URL of the `osrm-routed` process, without a trailing slash.
   */
  baseUrl: env.get('OSRM_URL', 'http://127.0.0.1:5000'),

  /**
   * The profile segment of the OSRM URL.
   *
   * OSRM does not actually dispatch on this value — a server built with
   * `car.lua` answers on any profile name — but it has to be present in the
   * path, and writing the real profile here keeps the URL honest.
   */
  profile: env.get('OSRM_PROFILE', 'driving'),

  /**
   * How long a matrix request may take before the trip board gives up.
   *
   * Short on purpose. A staff member refreshing the task board should never
   * sit and wait on a router that is wedged; falling back to straight-line
   * distances is worse routing but instant, and a late board is a worse
   * failure than an imprecise one.
   */
  timeoutMs: env.get('OSRM_TIMEOUT_MS', 3000),

  /**
   * The largest number of coordinates a single `/table` call may carry.
   *
   * This mirrors `osrm-routed`'s own `--max-table-size`, which defaults to
   * 100. It is a per-request ceiling, not a daily allowance: the matrix is
   * N x N, so 100 coordinates already means 10,000 cells. A trip queue that
   * somehow exceeds it falls back rather than sending a request the router
   * is only going to reject.
   */
  maxTableSize: env.get('OSRM_MAX_TABLE_SIZE', 100),
} as const
