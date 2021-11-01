import type { AdapterPool, PostgresConnection } from './types'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'
import { isTimeoutError, isConnectionTerminatedError } from './errors'
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
    if (useDistinctConnection) {
      connection = makePostgresClient(pool)
    } else {
      await pool.getConnectPromise()
      if (pool.connection === undefined)
        throw new Error('Impossible state: connection must not be null')
      connection = pool.connection
    }
    try {
      if (useDistinctConnection) {
        await connection.connect()
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
        if (!useDistinctConnection) {
          pool.getConnectPromise = pool.createGetConnectPromise()
        }

        if (reconnectionTimes > MAX_RECONNECTIONS) {
          throw error
        }

        reconnectionTimes++
      } else if (
        error != null &&
        error.message === 'Client was closed and is not queryable'
      ) {
        if (reconnectionTimes > MAX_RECONNECTIONS) {
          throw error
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
