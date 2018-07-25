import mysql from 'mysql2/promise'
import { escapeId } from 'mysql2'
import { ConcurrentError } from 'resolve-storage-base'

const longStringSqlType =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const customObjectSqlType = 'JSON NULL'

const convertBinaryRow = row => Object.setPrototypeOf(row, Object.prototype)

// https://dev.mysql.com/doc/refman/5.5/en/error-messages-server.html#error_er_dup_entry
const ER_DUP_ENTRY = 1062

const endorseEventTable = async (tableName, options) => {
  const connectionOptions = {
    host: options.host || '127.0.0.1',
    port: options.port || 3306,
    user: options.user || 'root',
    password: options.password || '',
    database: options.database || 'temp'
  }

  const connection = await mysql.createConnection(connectionOptions)

  await connection.execute(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      timestamp ${longNumberSqlType},
      aggregateId ${longStringSqlType},
      aggregateVersion ${longNumberSqlType},
      type ${longStringSqlType},
      payload ${customObjectSqlType},
      PRIMARY KEY(aggregateId, aggregateVersion),
      INDEX USING BTREE(type),
      INDEX USING BTREE(timestamp)
    )`,
    []
  )

  return connection
}

const saveEvent = async (connectionPromise, tableName, event) => {
  const connection = await connectionPromise
  try {
    await connection.execute(
      `INSERT INTO ${escapeId(tableName)}
      (timestamp, aggregateId, aggregateVersion, type, payload)
      VALUES (?, ?, ?, ?, ?)`,
      [
        event.timestamp,
        event.aggregateId,
        event.aggregateVersion,
        event.type,
        event.payload
      ]
    )
  } catch (error) {
    if (error.errno === ER_DUP_ENTRY) {
      throw new ConcurrentError()
    }
    throw error
  }
}

const loadEventsByTypes = async (
  connectionPromise,
  tableName,
  types,
  callback,
  startTime = 0
) => {
  const connection = await connectionPromise

  if (
    !Array.isArray(types) ||
    types.length === 0 ||
    !Number.isInteger(startTime) ||
    startTime < 0
  ) {
    return
  }

  let [rows] = await connection.execute(
    `SELECT * FROM ${escapeId(tableName)}
    WHERE timestamp > ? AND
    type IN (${types.map(() => '?')})
    `,
    [startTime, ...types]
  )

  for (const row of rows) {
    callback(convertBinaryRow(row))
  }
}

const loadEventsByAggregateIds = async (
  connectionPromise,
  tableName,
  aggregateIds,
  callback,
  startTime = 0
) => {
  const connection = await connectionPromise

  if (
    !Array.isArray(aggregateIds) ||
    aggregateIds.length === 0 ||
    !Number.isInteger(startTime) ||
    startTime < 0
  ) {
    return
  }

  let [rows] = await connection.execute(
    `SELECT * FROM ${escapeId(tableName)}
    WHERE timestamp > ? AND
    aggregateId IN (${aggregateIds.map(() => '?')})
    `,
    [startTime, ...aggregateIds]
  )

  for (const row of rows) {
    callback(convertBinaryRow(row))
  }
}

const createAdapter = ({ tableName = 'EventStore', ...options }) => {
  const connectionPromise = endorseEventTable(tableName, options)

  return {
    saveEvent: saveEvent.bind(null, connectionPromise, tableName),
    loadEventsByTypes: loadEventsByTypes.bind(
      null,
      connectionPromise,
      tableName
    ),
    loadEventsByAggregateIds: loadEventsByAggregateIds.bind(
      null,
      connectionPromise,
      tableName
    )
  }
}

export default createAdapter
