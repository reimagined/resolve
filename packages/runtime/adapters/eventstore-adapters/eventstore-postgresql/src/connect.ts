import { getLog } from './get-log'
import type { AdapterPool } from './types'
import makePostgresClient from './make-postgres-client'
import makeKnownError from './make-known-error'

const connect = async (pool: AdapterPool): Promise<void> => {
  const log = getLog('connect')
  log.debug('configuring postgres client')

  const oldConnection = pool.connection
  if (oldConnection !== undefined) {
    pool.connection = undefined
    oldConnection.end((err) => {
      if (err)
        log.error(`Error during disconnection before reconnection: ${err}`)
    })
  }

  const connection = makePostgresClient(pool)

  try {
    await connection.connect()
    pool.connection = connection
  } catch (error) {
    throw makeKnownError(error)
  }
  log.debug('connection to postgres database established')
}

export default connect
