import type { AdapterPool } from './types'

const establishTimeLimit = (
  pool: AdapterPool,
  getVacantTimeInMillis: () => number
) => {
  if (pool.connection !== undefined) {
    pool.getConnectPromise = pool.createGetConnectPromise()
  }
  pool.getVacantTimeInMillis = getVacantTimeInMillis
}

export default establishTimeLimit
