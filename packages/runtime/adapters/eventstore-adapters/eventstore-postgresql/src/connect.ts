import { getLog } from './get-log'
import type { AdapterPool } from './types'
import makePostgresClient from './make-postgres-client'

let connectionIndex = 0

const connect = async (
  pool: AdapterPool
): Promise<ReturnType<typeof makePostgresClient>> => {
  const log = getLog('connect')
  log.debug('configuring postgres client')

  const oldConnection = pool.connection
  if (oldConnection !== undefined) {
    pool.connection = undefined
    try {
      oldConnection.end((err) => {
        if (err)
          log.error(`Error during disconnection before reconnection: ${err}`)
      })
    } catch (err) {
      log.error(`Unexpected exception from client.end with callback! ${err}`)
    }
  }

  const connection = makePostgresClient(pool)

  await connection.connect()
  pool.connection = connection
  log.debug('connection to postgres database established')
  log.debug(`connection index: ${connectionIndex++}`)
  return pool.connection
}

export default connect
