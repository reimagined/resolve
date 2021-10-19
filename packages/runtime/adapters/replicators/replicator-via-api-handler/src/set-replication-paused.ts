import { InternalMethods } from './types'
import fetch from 'node-fetch'

import {
  PAUSE_REPLICATION,
  RESUME_REPLICATION,
} from '@resolve-js/module-replication'

const setReplicationPaused: InternalMethods['setReplicationPaused'] = async (
  pool,
  paused
) => {
  if (paused) {
    await fetch(`${pool.targetApplicationUrl}${PAUSE_REPLICATION.endpoint}`, {
      method: PAUSE_REPLICATION.method,
    })
  } else {
    await fetch(`${pool.targetApplicationUrl}${RESUME_REPLICATION.endpoint}`, {
      method: RESUME_REPLICATION.method,
    })
  }
}

export default setReplicationPaused
