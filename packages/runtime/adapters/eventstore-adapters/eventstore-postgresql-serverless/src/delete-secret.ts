import getLog from './get-log'
import { AdapterPool } from './types'
import {
  ConcurrentError,
  EventstoreFrozenError,
  InputEvent,
  makeDeleteSecretEvent,
} from '@resolve-js/eventstore-base'
import { LONG_NUMBER_SQL_TYPE, RESERVED_EVENT_SIZE } from './constants'

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<boolean> => {
  const log = getLog('secretsManager:deleteSecret')

  log.debug(`removing secret from the database`)
  const {
    databaseName,
    eventsTableName,
    secretsTableName,
    escapeId,
    escape,
    executeStatement,
    isTimeoutError,
  } = pool

  // TODO: refactor
  if (
    !secretsTableName ||
    !escapeId ||
    !escape ||
    !databaseName ||
    !executeStatement
  ) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId = escapeId(databaseName)
  const databaseNameAsString = escape(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableNameAsString: string = escape(`${eventsTableName}-freeze`)
  const threadsTableAsId: string = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId: string = escapeId(eventsTableName)

  const setSecretEvent: InputEvent = makeDeleteSecretEvent(selector)
  const serializedPayload = JSON.stringify(setSecretEvent.payload)

  const serializedEvent: string = [
    `${escape(setSecretEvent.aggregateId)},`,
    `${+setSecretEvent.aggregateVersion},`,
    `${escape(setSecretEvent.type)},`,
    escape(serializedPayload),
  ].join('')

  // TODO: Improve calculation byteLength depend on codepage and wide-characters
  const byteLength: number =
    Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  try {
    deletingSecret: while (true) {
      try {
        // logging of this sql query can lead to security issues

        // prettier-ignore
        const rows = await executeStatement(
          `WITH "freeze_check" AS (
              SELECT 0 AS "freeze_zero" WHERE (
                (SELECT 1 AS "EventStoreIsFrozen")
              UNION ALL
                (SELECT 1 AS "EventStoreIsFrozen"
                FROM "information_schema"."tables"
                WHERE "table_schema" = ${databaseNameAsString}
                AND "table_name" = ${freezeTableNameAsString})
              ) = 1
            ), "vacant_thread_id" AS (
              SELECT "threadId"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              FOR NO KEY UPDATE SKIP LOCKED
              LIMIT 1
            ), "random_thread_id" AS (
              SELECT "threadId"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              OFFSET FLOOR(Random() * 256)
              LIMIT 1
            ), "vector_id" AS (
              SELECT "threadId", "threadCounter"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              WHERE "threadId" = COALESCE(
                (SELECT "threadId" FROM "vacant_thread_id"),
                (SELECT "threadId" FROM "random_thread_id")
              ) FOR NO KEY UPDATE
              LIMIT 1
            ), "update_vector_id" AS (
              UPDATE ${databaseNameAsId}.${threadsTableAsId}
              SET "threadCounter" = "threadCounter" + 1
              WHERE "threadId" = (
                SELECT "threadId" FROM "vector_id" LIMIT 1
              )
              RETURNING *
            ), "delete_secret" AS (
              UPDATE ${databaseNameAsId}.${secretsTableNameAsId} 
              SET secret = NULL
              WHERE "id"=${escape(selector)} AND "secret" IS NOT NULL
              RETURNING "id"
            ) INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
              "threadId",
              "threadCounter",
              "timestamp",
              "aggregateId",
              "aggregateVersion",
              "type",
              "payload",
              "eventSize"
            ) SELECT
              (SELECT "threadId" FROM "vector_id" LIMIT 1) +
              (SELECT "freeze_zero" FROM "freeze_check" LIMIT 1),
              (SELECT "threadCounter" FROM "vector_id" LIMIT 1),
              GREATEST(
                CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),
                ${+setSecretEvent.timestamp}
              ),
              ${serializedEvent},
              ${byteLength}
            WHERE (SELECT COUNT(*) FROM "delete_secret") = 1
            RETURNING "threadId", "threadCounter"`
        )
        return rows.length === 1
      } catch (error) {
        if (isTimeoutError(error)) {
          while (true) {
            try {
              const rows = await executeStatement(
                `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId} 
                WHERE "aggregateId"=${escape(setSecretEvent.aggregateId)} 
                AND "aggregateVersion"=${+setSecretEvent.aggregateVersion}
                LIMIT 1
                `
              )
              if (rows[0] == null) {
                continue deletingSecret
              }
              break
            } catch (selectError) {
              if (isTimeoutError(selectError)) {
                continue
              } else {
                throw selectError
              }
            }
          }
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage.indexOf('subquery used as an expression') > -1) {
      throw new EventstoreFrozenError()
    } else if (/aggregateIdAndVersion/i.test(errorMessage)) {
      throw new ConcurrentError(setSecretEvent.aggregateId)
    } else {
      throw error
    }
  }
}

export default deleteSecret
