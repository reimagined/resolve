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
  distinctConnection?: boolean
): Promise<any[]> => {
  let reconnectionTimes = 0
  let useDistinctConnection = distinctConnection
  let distinctConnectionMade = false

  while (true) {
    let connection: PostgresConnection

    try {
      if (useDistinctConnection) {
        connection = makePostgresClient(pool)
        await connection.connect()
        distinctConnectionMade = true
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
        useDistinctConnection = true
        reconnectionTimes++
      } else if (
        error != null &&
        error.message === 'Client was closed and is not queryable'
      ) {
        if (reconnectionTimes > MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }
        useDistinctConnection = true
        reconnectionTimes++
      } else {
        throw error
      }
    } finally {
      if (distinctConnectionMade) {
        connection.end((err) => {
          return
        })
      }
    }
  }
}

export default executeStatement
