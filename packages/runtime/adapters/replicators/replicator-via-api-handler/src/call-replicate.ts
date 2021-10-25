import { InternalMethods, CallReplicateResult } from './types'
import fetch from 'node-fetch'

import { REPLICATE } from '@resolve-js/module-replication'

const callReplicate: InternalMethods['callReplicate'] = async (
  pool,
  events,
  secretsToSet,
  secretsToDelete,
  iterator
) => {
  const data = {
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
  const message = await response.text()
  if (response.status >= 500) {
    resultType = 'serverError'
  } else if (response.status >= 400) {
    resultType = 'clientError'
  } else if (response.status === 202 || response.status === 200) {
    resultType = 'launched'
  }
  return {
    type: resultType,
    httpStatus: response.status,
    message: message,
  }
}

export default callReplicate
