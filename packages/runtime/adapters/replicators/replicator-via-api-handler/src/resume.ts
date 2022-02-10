import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName) => {
  await pool.setReplicationPaused(pool, false)
  return {
    type: 'build-direct-invoke',
    payload: {
      continue: true,
    },
  }
}

export default resume
