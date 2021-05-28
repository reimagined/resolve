// Note: this file is used only in tests for automatic schema deletion

import { Client as Postgres } from 'pg'
import { PostgresResourceConfig } from '../types'
import escapeId from '../escape-id'

const destroy = async (options: PostgresResourceConfig) => {
  const {
    databaseName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = options

  const connection = new Postgres({
    ...connectionOptions,
  })

  await connection.connect()
  await connection.query(
    `DROP SCHEMA IF EXISTS ${escapeId(databaseName)} CASCADE`
  )
  await connection.end()
}

export default destroy
