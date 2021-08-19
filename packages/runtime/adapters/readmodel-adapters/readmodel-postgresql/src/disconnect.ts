import type { CurrentDisconnectMethod } from './types'

const MAX_DISCONNECT_TIME = 10000

const disconnect: CurrentDisconnectMethod = async (pool) => {
  if (pool.connection != null) {
    try {
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, MAX_DISCONNECT_TIME)),
        pool.connection.end(),
      ])
    } catch (err) {}
  }
}

export default disconnect
