import { getLog } from './get-log'
import type { AdapterPool } from './types'
import MySQL from 'mysql2/promise'

const connect = async (pool: AdapterPool): Promise<void> => {
  const log = getLog('connect')
  log.debug('connecting to mysql databases')

  log.debug(`establishing connection`)

  const connection: any = await MySQL.createConnection({
    ...pool.connectionOptions,
    database: pool.database,
    multipleStatements: true,
  })

  const [[{ version }]] = await connection.query(
    `SELECT version() AS \`version\``
  )
  const major: number = +version.split('.')[0]
  if (isNaN(major) || major < 8) {
    throw new Error(`Supported MySQL version 8+, but got ${version}`)
  }

  log.debug(`connected successfully`)

  pool.connection = connection

  log.debug('connection to mysql database established')
}

export default connect
