import type { CurrentDisconnectMethod } from './types'

const MAX_DISCONNECT_TIME = 10000

const disconnect: CurrentDisconnectMethod = async (pool) => {
  if (pool.connection != null) {
    let timeout: NodeJS.Timeout | null = null

    try {
      await Promise.race([
        new Promise((resolve) => {
          timeout = setTimeout(resolve, MAX_DISCONNECT_TIME)
        }),
        pool.connection.end(),
      ])
    } catch (err) {
    } finally {
      if (timeout != null) {
        clearTimeout(timeout)
      }
    }
  }
}

export default disconnect
