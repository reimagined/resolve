import { InternalMethods } from './types'
import fetch from 'node-fetch'

const setReplicationPaused: InternalMethods['setReplicationPaused'] = async (
  pool,
  paused
) => {
  if (paused) {
    await fetch(`${pool.targetApplicationUrl}/api/pause-replication`, {
      method: 'POST',
    })
  } else {
    await fetch(`${pool.targetApplicationUrl}/api/resume-replication`, {
      method: 'POST',
    })
  }
}

export default setReplicationPaused
