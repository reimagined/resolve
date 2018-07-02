import mysql, { escapeId } from 'mysql2'
import { ConcurrentError } from 'resolve-storage-base'

const longStringSqlType = 'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const customObjectSqlType = 'JSON NULL'

const convertBinaryRow = row => Object.setPrototypeOf(row, Object.prototype)

function createAdapter({ tableName, ...options }) {
  let promise

  function endorseEventTable() {
    if (!promise) {
      promise = (async () => {
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
            type VARCHAR(700) ${longStringSqlType},
            payload ${customObjectSqlType},
            PRIMARY KEY(aggregateId, aggregateVersion),
            INDEX USING BTREE(type),
            INDEX USING BTREE(timestamp)
          )`,
          []
        )

        return connection
      })()
    }

    return promise
  }

  return {
    saveEvent: event =>
      endorseEventTable()
        .then(async connection => {
          await connection.execute(
            `INSERT INTO ${escapeId(tableName)}
            (timestamp, aggregateId, aggregateVersion, type, payload)
            VALUES (?, ?, ?, ?, ?)`,
            [event.timestamp, event.aggregateId, event.aggregateVersion, event.type, event.payload]
          )
        })
        .catch(e => {
          if (e.code === DUPLICATE_KEY_ERROR) {
            throw new ConcurrentError()
          }
          throw e
        }),

    loadEventsByTypes: (types, callback, startTime = 0) =>
      endorseEventTable()
        .then(async connection => {
          if (!Array.isArray(types) || types.length === 0) {
            return []
          }

          let [rows] = await connection.execute(
            `SELECT * FROM ${escapeId(tableName)}
            WHERE timestamp > ? AND
            type IN (${types.map(() => '?')})
            `,
            [startTime, ...types]
          )

          for (let idx = 0; idx < rows.length; idx++) {
            rows[idx] = convertBinaryRow(rows[idx])
          }

          return rows
        })
        .then(rows => callback(rows))
        .catch(err => callback(err)),

    loadEventsByAggregateIds: (aggregateIds, callback, startTime = 0) =>
      endorseEventTable()
        .then(async connection => {
          if (!Array.isArray(aggregateIds) || aggregateIds.length === 0) {
            return []
          }

          let [rows] = await connection.execute(
            `SELECT * FROM ${escapeId(tableName)}
            WHERE timestamp > ? AND
            aggregateId IN (${aggregateIds.map(() => '?')})
            `,
            [startTime, ...aggregateIds]
          )

          for (let idx = 0; idx < rows.length; idx++) {
            rows[idx] = convertBinaryRow(rows[idx])
          }

          return rows
        })
        .then(rows => callback(rows))
        .catch(err => callback(err))
  }
}

export default createAdapter
