import { InternalMethods, CallReplicateResult } from './types'
import fetch from 'node-fetch'

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
  const response = await fetch(`${pool.targetApplicationUrl}/api/replicate`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
  let resultType: CallReplicateResult['type'] = 'unknown'
  if (response.status === 425) {
    resultType = 'alreadyInProgress'
  } else if (response.status === 202 || response.status === 200) {
    resultType = 'launched'
  }
  return {
    type: resultType,
    httpStatus: response.status,
  }
}

export default callReplicate
