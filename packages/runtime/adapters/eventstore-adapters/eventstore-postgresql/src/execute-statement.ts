import type { AdapterPool } from './types'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'
import { isTimeoutError, isConnectionTerminatedError } from './errors'
import { MAX_RECONNECTIONS } from './constants'
import { getLog } from './get-log'

const executeStatement = async (
  pool: AdapterPool,
  sql: string
): Promise<any[]> => {
  const log = getLog('executeStatement')

  let reConnectionTimes = 0

  while (true) {
    let connection: typeof pool.connection = pool.connection
    try {
      if (pool.connectionErrors.length > 0) {
        let summaryError = pool.connectionErrors[0]
        if (pool.connectionErrors.length > 1) {
          summaryError = new Error(
            pool.connectionErrors.map(({ message }) => message).join('\n')
          )
          summaryError.stack = pool.connectionErrors
            .map(({ stack }) => stack)
            .join('\n')
        }
        pool.connectionErrors = []

        pool.getConnectPromise = pool.createGetConnectPromise()

        throw summaryError
      }

      const result = await connection.query(sql)

      if (result != null && Array.isArray(result.rows)) {
        return result.rows as Array<any>
      }

      return []
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new RequestTimeoutError(error.message)
      } else if (isConnectionTerminatedError(error)) {
        try {
          await connection.end()
        } catch (error) {
          log.error(error)
        }

        if (reConnectionTimes > MAX_RECONNECTIONS) {
          throw error
        }

        await pool.getConnectPromise()
        reConnectionTimes++
      } else {
        throw error
      }
    }
  }
}

export default executeStatement
