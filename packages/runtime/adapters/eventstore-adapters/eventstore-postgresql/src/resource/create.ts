// Note: this file is used only in tests for automatic schema creation

import { Client as Postgres } from 'pg'
import { PostgresResourceConfig } from '../types'
import escapeId from '../escape-id'

const create = async (options: PostgresResourceConfig) => {
  const {
    databaseName,
    userLogin,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = options

  const connection = new Postgres({
    ...connectionOptions,
  })

  await connection.connect()

  const query = [
    `CREATE SCHEMA ${escapeId(databaseName)}`,

    `GRANT USAGE ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(userLogin)}`,

    `GRANT ALL ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(userLogin)}`,

    `GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(databaseName)} TO ${escapeId(
      userLogin
    )}`,

    `GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(
      databaseName
    )} TO ${escapeId(userLogin)}`,

    `GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(
      databaseName
    )} TO ${escapeId(userLogin)}`,

    `ALTER SCHEMA ${escapeId(databaseName)} OWNER TO ${escapeId(userLogin)}`,
  ].join('; ')

  try {
    await connection.query(query)
  } catch (err) {
    throw err
  } finally {
    await connection.end()
  }
}

export default create
