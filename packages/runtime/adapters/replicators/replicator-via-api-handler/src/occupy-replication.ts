import { InternalMethods } from './types'
import fetch from 'node-fetch'

import { OCCUPY_REPLICATION } from '@resolve-js/module-replication'

const occupyReplication: InternalMethods['occupyReplication'] = async (
  pool,
  duration: number
) => {
  const response = await fetch(
    `${pool.targetApplicationUrl}${OCCUPY_REPLICATION.endpoint}?duration=${duration}`,
    {
      method: OCCUPY_REPLICATION.method,
    }
  )
  if (response.status === 200) {
    return { success: true }
  } else {
    const text = await response.text()
    return {
      success: false,
      message: text,
    }
  }
}

export default occupyReplication
