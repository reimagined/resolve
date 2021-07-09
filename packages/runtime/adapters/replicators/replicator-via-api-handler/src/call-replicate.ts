import { InternalMethods, CallReplicateResult } from './types'
import fetch from 'node-fetch'

//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
