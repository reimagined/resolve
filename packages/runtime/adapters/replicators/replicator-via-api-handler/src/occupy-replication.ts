import { InternalMethods } from './types'
import fetch from 'node-fetch'

import { OCCUPY_REPLICATION } from '@resolve-js/module-replication'

const occupyReplication: InternalMethods['occupyReplication'] = async (
  pool,
  lockId: string,
  duration: number
) => {
  const response = await fetch(
    `${pool.targetApplicationUrl}${OCCUPY_REPLICATION.endpoint}`,
    {
      method: OCCUPY_REPLICATION.method,
      body: JSON.stringify({
        duration,
        lockId,
      }),
      headers: { 'Content-Type': 'application/json' },
    }
  )
  switch (response.status) {
    case 200:
      return { status: 'success' }
    case 409:
      return { status: 'alreadyLocked' }
    case 503:
      return { status: 'serviceError', message: await response.text() }
    default:
      return { status: 'error', message: await response.text() }
  }
}

export default occupyReplication
