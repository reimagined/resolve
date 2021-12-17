import type { AdapterPool } from './types'
import { getLog } from './get-log'

const MAX_DISCONNECT_TIME = 10000

const dispose = async (pool: AdapterPool): Promise<void> => {
  if (pool.connection != null) {
    const log = getLog('dispose')

    const extraClient = pool.extraConnections.values()
    pool.extraConnections.clear()

    //TODO: Promise.allSettled
    for (const client of extraClient) {
      try {
        await client.end()
      } catch (error) {
        log.error(`Could not end extra client connection: ${error}`)
      }
    }

    //TODO: Promise.allSettled
    const loaders = pool.eventLoaders.values()
    for (const loader of loaders) {
      await loader.close()
    }

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
