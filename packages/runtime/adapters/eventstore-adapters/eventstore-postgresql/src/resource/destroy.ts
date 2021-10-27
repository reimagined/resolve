import { Client as Postgres } from 'pg'
import { PostgresResourceConfig } from '../types'
import escapeId from '../escape-id'
import { getLog } from '../get-log'
import { EOL } from 'os'

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

  let alterSchemaError: any = null
  let dropSchemaError: any = null

  try {
    try {
      await connection.query(
        `ALTER SCHEMA ${escapeId(databaseName)} OWNER TO SESSION_USER`
      )
    } catch (error) {
      alterSchemaError = error
    }

    try {
      await connection.query(
        `DROP SCHEMA IF EXISTS ${escapeId(databaseName)} CASCADE`
      )
    } catch (error) {
      dropSchemaError = error
    }

    if (alterSchemaError != null || dropSchemaError != null) {
      const error = new Error()
      error.message = `${
        alterSchemaError != null ? `${alterSchemaError.message}${EOL}` : ''
      }${dropSchemaError != null ? `${dropSchemaError.message}${EOL}` : ''}`

      log.error(error.message)
      log.verbose(error.stack || error.message)

      throw error
    }

    log.debug(`resource destroyed successfully`)
  } finally {
    await connection.end()
  }
}

export default destroy
