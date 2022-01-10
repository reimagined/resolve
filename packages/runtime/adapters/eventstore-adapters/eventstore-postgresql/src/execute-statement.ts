import type { AdapterPool, PostgresConnection } from './types'
import {
  RequestTimeoutError,
  ServiceBusyError,
  AlreadyDisposedError,
} from '@resolve-js/eventstore-base'
import {
  isTimeoutError,
  isConnectionTerminatedError,
  isServiceBusyError,
  makeConnectionError,
  makeUnrecognizedError,
} from './errors'
import { isAlreadyExistsError, isNotExistError } from './resource-errors'
import { MAX_RECONNECTIONS, SERVICE_WAIT_TIME } from './constants'
import makePostgresClient from './make-postgres-client'

const DISPOSED_WHILE_RUNNING_MSG = 'Adapter disposed while operation is running'

const executeStatement = async (
  pool: AdapterPool,
  sql: string,
  distinctConnection?: boolean
): Promise<any[]> => {
  let reconnectionTimes = 0
  let useDistinctConnection = distinctConnection
  let distinctConnectionMade = false

  const incrementReconnectionTimes = () => {
    reconnectionTimes++
    if (pool.monitoring) {
      pool.monitoring.custom({
        metricName: 'EventstorePostgresqlReconnectionTimes',
        unit: 'Count',
      })
    }
  }

  const maxReconnectionTimes = pool.maxReconnectionTimes ?? MAX_RECONNECTIONS
  const delayBeforeReconnection =
    pool.delayBeforeReconnection ?? SERVICE_WAIT_TIME

  while (true) {
    if (pool.disposed) {
      throw new AlreadyDisposedError(DISPOSED_WHILE_RUNNING_MSG)
    }

    let connection: PostgresConnection | undefined

    try {
      if (useDistinctConnection) {
        connection = makePostgresClient(pool)
        await connection.connect()
        pool.extraConnections.add(connection)
        distinctConnectionMade = true
      } else {
        connection = await pool.getConnectPromise()
      }
    } catch (error) {
      if (!useDistinctConnection) {
        pool.getConnectPromise = pool.createGetConnectPromise()
      }
      if (isConnectionTerminatedError(error) || isServiceBusyError(error)) {
        if (reconnectionTimes >= maxReconnectionTimes) {
          throw new ServiceBusyError(error.message)
        }
        incrementReconnectionTimes()
        await new Promise((resolve) =>
          setTimeout(resolve, delayBeforeReconnection)
        )
        continue
      } else {
        throw makeConnectionError(error)
      }
    }

    let shouldWaitForServiceFree = false

    try {
      if (pool.disposed) {
        throw new AlreadyDisposedError(DISPOSED_WHILE_RUNNING_MSG)
      }

      const result = await connection.query(sql)

      if (result != null && Array.isArray(result.rows)) {
        return result.rows as Array<any>
      }

      return []
    } catch (error) {
      if (
        isAlreadyExistsError(error) ||
        isNotExistError(error) ||
        AlreadyDisposedError.is(error)
      ) {
        throw error
      } else if (isServiceBusyError(error)) {
        throw new ServiceBusyError(error.message)
      } else if (isTimeoutError(error)) {
        throw new RequestTimeoutError(error.message)
      } else if (isConnectionTerminatedError(error)) {
        if (!useDistinctConnection) {
          pool.getConnectPromise = pool.createGetConnectPromise()
        }
        if (reconnectionTimes >= maxReconnectionTimes) {
          throw new ServiceBusyError(error.message + `${useDistinctConnection}`)
        }
        useDistinctConnection = true
        shouldWaitForServiceFree = true
        incrementReconnectionTimes()
      } else if (
        error != null &&
        error.message === 'Client was closed and is not queryable'
      ) {
        if (pool.disposed) {
          throw new AlreadyDisposedError(DISPOSED_WHILE_RUNNING_MSG)
        }
        if (reconnectionTimes >= maxReconnectionTimes) {
          throw new ServiceBusyError(error.message)
        }
        useDistinctConnection = true
        shouldWaitForServiceFree = true
        incrementReconnectionTimes()
      } else {
        throw makeUnrecognizedError(error)
      }
    } finally {
      if (distinctConnectionMade) {
        pool.extraConnections.delete(connection)
        await connection.end()
      }
      if (shouldWaitForServiceFree) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBeforeReconnection)
        )
      }
    }
  }
}

export default executeStatement
