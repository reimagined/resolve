import { InternalMethods } from './types'
import fetch from 'node-fetch'

import { RELEASE_REPLICATION } from '@resolve-js/module-replication'

const releaseReplication: InternalMethods['releaseReplication'] = async (
  pool,
  lockId: string
) => {
  await fetch(`${pool.targetApplicationUrl}${RELEASE_REPLICATION.endpoint}`, {
    method: RELEASE_REPLICATION.method,
    body: JSON.stringify({
      lockId,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export default releaseReplication
