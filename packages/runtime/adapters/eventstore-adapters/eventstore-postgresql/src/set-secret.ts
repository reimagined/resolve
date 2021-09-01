import { getLog } from './get-log'
import type { AdapterPool } from './types'
import { LONG_NUMBER_SQL_TYPE, RESERVED_EVENT_SIZE } from './constants'
import type { InputEvent } from '@resolve-js/eventstore-base'
import {
  ConcurrentError,
  EventstoreFrozenError,
  makeSetSecretEvent,
} from '@resolve-js/eventstore-base'
import checkRequestTimeout from './check-request-timeout'

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  checkRequestTimeout(pool)

  const log = getLog('secretsManager:setSecret')

  log.debug(`setting secret value within database`)
  const {
    databaseName,
    secretsTableName,
    escape,
    escapeId,
    executeStatement,
    eventsTableName,
    getVacantTimeInMillis,
  } = pool

  // TODO: refactor
  if (
    !secretsTableName ||
    !escapeId ||
    !databaseName ||
    !executeStatement ||
    !escape
  ) {
    const error: Error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const setSecretEvent: InputEvent = makeSetSecretEvent(selector)
  const serializedPayload = JSON.stringify(setSecretEvent.payload)

  const serializedEvent: string = [
    `${escape(setSecretEvent.aggregateId)},`,
    `${+setSecretEvent.aggregateVersion},`,
    `${escape(setSecretEvent.type)},`,
    escape(serializedPayload),
  ].join('')

  // TODO: Improve calculation byteLength depend on codepage and wide-characters
  const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  const databaseNameAsString = escape(databaseName)
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)

  try {
    log.debug(`executing SQL query`)

    // logging of this sql query can lead to security issues
    await executeStatement(
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
        ), "set_secret" AS (
        INSERT INTO ${databaseNameAsId}.${secretsTableNameAsId}("id", "secret")
          VALUES (${escape(selector)}, ${escape(secret)})
        ) INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
          "threadId",
          "threadCounter",
          "timestamp",
          "aggregateId",
          "aggregateVersion",
          "type",
          "payload",
          "eventSize"
        ) VALUES (
          (SELECT "threadId" FROM "vector_id" LIMIT 1) +
          (SELECT "freeze_zero" FROM "freeze_check" LIMIT 1),
          (SELECT "threadCounter" FROM "vector_id" LIMIT 1),
          GREATEST(
            CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),
            ${+setSecretEvent.timestamp}
          ),
          ${serializedEvent},
          ${byteLength}
        )`,
      getVacantTimeInMillis !== undefined
    )

    log.debug(`query executed successfully`)
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

export default setSecret
