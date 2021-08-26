import type { AdapterPoolPrimal } from './types'

const establishTimeLimit = (
  pool: AdapterPoolPrimal,
  getVacantTimeInMillis: () => number
) => {
  if (pool.isConnected) {
    pool.getConnectPromise = pool.createGetConnectPromise()
  }
  pool.getVacantTimeInMillis = getVacantTimeInMillis
}

export default establishTimeLimit
