import { InternalMethods, CallReplicateResult } from './types'
import fetch from 'node-fetch'

import { REPLICATE } from '@resolve-js/module-replication'

const callReplicate: InternalMethods['callReplicate'] = async (
  pool,
  lockId,
  events,
  secretsToSet,
  secretsToDelete,
  iterator
) => {
  const data = {
    lockId,
    events,
    secretsToSet,
    secretsToDelete,
    iterator,
  }
  const response = await fetch(
    `${pool.targetApplicationUrl}${REPLICATE.endpoint}`,
    {
      method: REPLICATE.method,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }
  )
  let resultType: CallReplicateResult['type'] = 'unknown'
  const result = await response.json()
  if (response.status >= 500) {
    resultType = 'serverError'
  } else if (response.status >= 400) {
    resultType = 'clientError'
  } else if (response.status === 202) {
    resultType = 'launched'
  } else if (response.status === 200) {
    resultType = 'processed'
  }
  return {
    type: resultType,
    httpStatus: response.status,
    message: result.message ?? result,
    state: result.state ?? null,
  }
}

export default callReplicate
