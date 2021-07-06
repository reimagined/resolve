import type { CurrentDisconnectMethod } from './types'

const disconnect: CurrentDisconnectMethod = async (pool) => {
  if (pool.connection != null) {
    await pool.connection.end()
  }
}

export default disconnect
