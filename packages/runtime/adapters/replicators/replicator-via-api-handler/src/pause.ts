import type { ExternalMethods } from './types'

const pause: ExternalMethods['pause'] = async (pool, readModelName) => {
  await pool.setReplicationPaused(pool, true)
}

export default pause
