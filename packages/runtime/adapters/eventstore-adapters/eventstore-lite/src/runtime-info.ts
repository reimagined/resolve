import type { AdapterPool } from './types'
import type { AdapterRuntimeInfo } from '@resolve-js/eventstore-base'

const runtimeInfo = (pool: AdapterPool): AdapterRuntimeInfo => {
  return {
    disposed: pool.disposed,
    connectionCount: pool.database === undefined ? 0 : 1,
  }
}

export default runtimeInfo
