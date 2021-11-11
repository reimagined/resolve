import type { AdapterPool, PostgresConnection } from './types'
import {
  RequestTimeoutError,
  ServiceBusyError,
} from '@resolve-js/eventstore-base'
import {
  isTimeoutError,
  isConnectionTerminatedError,
  isServiceBusyError,
  makeConnectionError,
} from './errors'
import { MAX_RECONNECTIONS } from './constants'
import makePostgresClient from './make-postgres-client'

const executeStatement = async (
  pool: AdapterPool,
  sql: string,
  useDistinctConnection?: boolean
): Promise<any[]> => {
  let reconnectionTimes = 0

  while (true) {
    let connection: PostgresConnection

    try {
      if (useDistinctConnection) {
        connection = makePostgresClient(pool)
        await connection.connect()
      } else {
        connection = await pool.getConnectPromise()
      }
    } catch (error) {
      if (!useDistinctConnection) {
        pool.getConnectPromise = pool.createGetConnectPromise()
      }
      throw makeConnectionError(error)
    }

    try {
      const result = await connection.query(sql)

      if (result != null && Array.isArray(result.rows)) {
        return result.rows as Array<any>
      }

      return []
    } catch (error) {
      if (isServiceBusyError(error)) {
        throw new ServiceBusyError(error.message)
      } else if (isTimeoutError(error)) {
        throw new RequestTimeoutError(error.message)
      } else if (isConnectionTerminatedError(error)) {
        if (!useDistinctConnection) {
          pool.getConnectPromise = pool.createGetConnectPromise()
        }

        if (reconnectionTimes > MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }

        reconnectionTimes++
      } else if (
        error != null &&
        error.message === 'Client was closed and is not queryable'
      ) {
        if (reconnectionTimes > MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }
        reconnectionTimes++
      } else {
        throw error
      }
    } finally {
      if (useDistinctConnection) {
        connection.end((err) => {
          return
        })
      }
    }
  }
}

export default executeStatement
