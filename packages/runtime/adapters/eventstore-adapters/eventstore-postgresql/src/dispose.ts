import type { AdapterPool } from './types'
import { getLog } from './get-log'

const MAX_DISCONNECT_TIME = 10000

const dispose = async (pool: AdapterPool): Promise<void> => {
  const log = getLog('dispose')

  const extraClients = Array.from(pool.extraConnections.values())
  pool.extraConnections.clear()

  const endResults = await Promise.allSettled(
    extraClients.map((client) => client.end())
  )
  for (const result of endResults) {
    if (result.status === 'rejected') {
      log.error(`Could not end extra client connection: ${result.reason}`)
    }
  }

  const loaders = Array.from(pool.eventLoaders.values())
  pool.eventLoaders.clear()

  const closeResults = await Promise.allSettled(
    loaders.map((loader) => loader.close())
  )
  for (const result of closeResults) {
    if (result.status === 'rejected') {
      log.error(`Could not close event loader connection: ${result.reason}`)
    }
  }

  if (pool.connection != null) {
    const connection = pool.connection
    pool.connection = undefined
    let timeout: NodeJS.Timeout | null = null
    try {
      await Promise.race([
        new Promise((resolve) => {
          timeout = setTimeout(resolve, MAX_DISCONNECT_TIME)
        }),
        connection.end(),
      ])
    } catch (err) {
      log.error(err)
    } finally {
      if (timeout != null) {
        clearTimeout(timeout)
      }
    }
  }
}

export default dispose
