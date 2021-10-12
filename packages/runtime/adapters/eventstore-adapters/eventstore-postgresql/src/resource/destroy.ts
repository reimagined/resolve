// Note: this file is used only in tests for automatic schema deletion

import { Client as Postgres } from 'pg'
import { PostgresResourceConfig } from '../types'
import escapeId from '../escape-id'
import { getLog } from '../get-log'

const destroy = async (options: PostgresResourceConfig) => {
  const log = getLog(`resource: destroy`)

  const {
    databaseName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = options

  const connection = new Postgres({
    ...connectionOptions,
  })

  await connection.connect()

  try {
    await connection.query(
      `ALTER SCHEMA ${escapeId(databaseName)} OWNER TO SESSION_USER`
    )
  } catch (err) {
    log.error(err.message)
    log.verbose(err.stack)
  }

  try {
    await connection.query(
      `DROP SCHEMA IF EXISTS ${escapeId(databaseName)} CASCADE`
    )
  } catch (err) {
    log.error(err.message)
    log.verbose(err.stack)
  }

  await connection.end()
  log.debug(`resource destroyed successfully`)
}

export default destroy
