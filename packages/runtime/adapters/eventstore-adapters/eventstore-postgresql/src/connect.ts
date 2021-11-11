import { getLog } from './get-log'
import type { AdapterPool } from './types'
import makePostgresClient from './make-postgres-client'

const connect = async (
  pool: AdapterPool
): Promise<ReturnType<typeof makePostgresClient>> => {
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

  await connection.connect()
  pool.connection = connection
  log.debug('connection to postgres database established')
  return pool.connection
}

export default connect
