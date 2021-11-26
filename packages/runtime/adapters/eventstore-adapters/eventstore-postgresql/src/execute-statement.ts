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
  makeUnrecognizedError,
} from './errors'
import { isAlreadyExistsError, isNotExistError } from './resource-errors'
import { MAX_RECONNECTIONS } from './constants'
import makePostgresClient from './make-postgres-client'

const SERVICE_WAIT_TIME = 1000

const executeStatement = async (
  pool: AdapterPool,
  sql: string,
  distinctConnection?: boolean
): Promise<any[]> => {
  let reconnectionTimes = 0
  let useDistinctConnection = distinctConnection
  let distinctConnectionMade = false

  while (true) {
    let connection: PostgresConnection | undefined

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
      if (isConnectionTerminatedError(error) || isServiceBusyError(error)) {
        if (reconnectionTimes >= MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }
        reconnectionTimes++
        await new Promise((resolve) => setTimeout(resolve, SERVICE_WAIT_TIME))
        continue
      } else {
        throw makeConnectionError(error)
      }
    }

    let shouldWaitForServiceFree = false

    try {
      const result = await connection.query(sql)

      if (result != null && Array.isArray(result.rows)) {
        return result.rows as Array<any>
      }

      return []
    } catch (error) {
      if (isAlreadyExistsError(error) || isNotExistError(error)) {
        throw error
      } else if (isServiceBusyError(error)) {
        throw new ServiceBusyError(error.message)
      } else if (isTimeoutError(error)) {
        throw new RequestTimeoutError(error.message)
      } else if (isConnectionTerminatedError(error)) {
        if (!useDistinctConnection) {
          pool.getConnectPromise = pool.createGetConnectPromise()
        }
        if (reconnectionTimes >= MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }
        useDistinctConnection = true
        shouldWaitForServiceFree = true
        reconnectionTimes++
      } else if (
        error != null &&
        error.message === 'Client was closed and is not queryable'
      ) {
        if (reconnectionTimes >= MAX_RECONNECTIONS) {
          throw new ServiceBusyError(error.message)
        }
        useDistinctConnection = true
        shouldWaitForServiceFree = true
        reconnectionTimes++
      } else {
        throw makeUnrecognizedError(error)
      }
    } finally {
      if (distinctConnectionMade) {
        connection.end((err) => {
          return
        })
      }
      if (shouldWaitForServiceFree) {
        await new Promise((resolve) => setTimeout(resolve, SERVICE_WAIT_TIME))
      }
    }
  }
}

export default executeStatement
