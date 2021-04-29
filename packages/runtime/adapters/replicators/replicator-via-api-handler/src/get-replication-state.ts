import { InternalMethods, ReadModelEvent, ReadModelRunStatus } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import fetch from 'node-fetch'

const getReplicationState: InternalMethods['getReplicationState'] = async (
  pool
) => {
  try {
    const response = await fetch(
      `${pool.targetApplicationUrl}/api/replication-state`
    )
    const state: ReplicationState = await response.json()
    return state
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'FetchError') {
      const state: ReplicationState = {
        status: 'error',
        statusData: {
          name: error.name as string,
          message: error.message as string,
          stack: error.stack ? (error.stack as string) : null,
        },
        paused: false,
        iterator: null,
        successEvent: null,
      }
      return state
    } else {
      throw error
    }
  }
}

export default getReplicationState
