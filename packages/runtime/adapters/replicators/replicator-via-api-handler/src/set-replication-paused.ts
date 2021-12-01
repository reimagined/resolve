import { InternalMethods } from './types'
import fetch from 'node-fetch'
import HttpError from './http-error'

import {
  PAUSE_REPLICATION,
  RESUME_REPLICATION,
} from '@resolve-js/module-replication'

const setReplicationPaused: InternalMethods['setReplicationPaused'] = async (
  pool,
  paused
) => {
  const endpoint = paused ? PAUSE_REPLICATION : RESUME_REPLICATION
  const response = await fetch(
    `${pool.targetApplicationUrl}${endpoint.endpoint}`,
    {
      method: endpoint.method,
    }
  )
  if (!response.ok) {
    throw new HttpError(await response.text(), response.status)
  }
}

export default setReplicationPaused
