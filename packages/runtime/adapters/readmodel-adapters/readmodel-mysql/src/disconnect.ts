import type { CurrentDisconnectMethod } from './types'

const disconnect: CurrentDisconnectMethod = async (pool) => {
  await pool.connection.end()
}

export default disconnect
