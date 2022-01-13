import type { AdapterPool } from './types'
import type { AdapterRuntimeInfo } from '@resolve-js/eventstore-base'
import { MAX_RECONNECTIONS, SERVICE_WAIT_TIME } from './constants'

const runtimeInfo = (pool: AdapterPool): AdapterRuntimeInfo => {
  return {
    disposed: pool.disposed,
    connectionCount:
      pool.extraConnections.size +
      pool.eventLoaders.size +
      (pool.connection === undefined ? 0 : 1),
    maxReconnectionTimes: pool.maxReconnectionTimes ?? MAX_RECONNECTIONS,
    delayBeforeReconnection: pool.delayBeforeReconnection ?? SERVICE_WAIT_TIME,
    processID: pool.connection ? (pool.connection as any).processID : undefined,
  }
}

export default runtimeInfo
