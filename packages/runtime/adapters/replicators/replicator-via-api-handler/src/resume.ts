import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName, next) => {
  await pool.setReplicationPaused(pool, false)
  await next()
}

export default resume
