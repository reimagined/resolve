import type { AdapterPool } from './types'
import { getLog } from './get-log'

const MAX_DISCONNECT_TIME = 10000

const dispose = async ({ connection }: AdapterPool): Promise<void> => {
  if (connection != null) {
    const log = getLog('dispose')

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
