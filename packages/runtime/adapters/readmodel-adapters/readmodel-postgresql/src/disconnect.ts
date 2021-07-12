import type { CurrentDisconnectMethod } from './types'

const disconnect: CurrentDisconnectMethod = async (pool) => {
  if (pool.connection != null) {
    try {
      await pool.connection.end()
    } catch (err) {}
  }
}

export default disconnect
