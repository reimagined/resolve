// Note: this file is used only in tests for automatic schema creation

import { Client as Postgres } from 'pg'
import { PostgresResourceConfig } from '../types'
import escapeId from '../escape-id'

const create = async (options: PostgresResourceConfig) => {
  const {
    databaseName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = options

  const connection = new Postgres({
    ...connectionOptions,
  })

  await connection.connect()
  await connection.query(`CREATE SCHEMA ${escapeId(databaseName)}`)
  await connection.end()
}

export default create
