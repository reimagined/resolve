import type { AdapterPool } from './types'
import type { ReconnectionMode } from '@resolve-js/eventstore-base'

const setReconnectionMode = (
  pool: AdapterPool,
  mode: ReconnectionMode
): void => {
  if (mode.maxReconnectionTimes != null) {
    if (isNaN(+mode.maxReconnectionTimes) || +mode.maxReconnectionTimes < 0) {
      throw new Error(
        `maxReconnectionTimes must be non-negative number. Got ${mode.maxReconnectionTimes}`
      )
    }
    pool.maxReconnectionTimes = mode.maxReconnectionTimes
  }
  if (mode.delayBeforeReconnection != null) {
    if (
      isNaN(+mode.delayBeforeReconnection) ||
      +mode.delayBeforeReconnection < 0
    ) {
      throw new Error(
        `delayBeforeReconnection must be non-negative number. Got ${mode.delayBeforeReconnection}`
      )
    }
    pool.delayBeforeReconnection = mode.delayBeforeReconnection
  }
}

export default setReconnectionMode
