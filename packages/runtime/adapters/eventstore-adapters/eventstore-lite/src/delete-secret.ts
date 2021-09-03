import { getLog } from './get-log'
import type { AdapterPool } from './types'
import {
  EventstoreFrozenError,
  InputEvent,
  makeDeleteSecretEvent,
  THREAD_COUNT,
} from '@resolve-js/eventstore-base'
import isIntegerOverflowError from './integer-overflow-error'

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<boolean> => {
  const {
    executeQuery,
    secretsTableName,
    escapeId,
    escape,
    eventsTableName,
  } = pool

  const log = getLog('secretsManager:deleteSecret')
  log.debug(`removing secret from the database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const secretsTableNameAsId = escapeId(secretsTableName)
  const currentThreadId = Math.floor(Math.random() * THREAD_COUNT)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)

  const deleteSecretEvent: InputEvent = makeDeleteSecretEvent(selector)
  const serializedPayload = escape(JSON.stringify(deleteSecretEvent.payload))

  log.debug(`executing SQL query`)

  try {
    await executeQuery(
      `BEGIN IMMEDIATE;

    SELECT ABS("CTE"."EventStoreIsFrozen") FROM (
        SELECT 0 AS "EventStoreIsFrozen"
      UNION ALL
        SELECT -9223372036854775808 AS "EventStoreIsFrozen"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${freezeTableNameAsString}
      ) CTE;

    SELECT json_type("CTE2"."SecretIsDeleted") FROM (
        SELECT '{}' AS "SecretIsDeleted"
      UNION ALL
        SELECT 'Malformed' AS "SecretIsDeleted"
        FROM ${secretsTableNameAsId}
        WHERE id = ${escape(selector)} AND secret IS NULL
      UNION ALL
        SELECT 'Malformed' FROM secrets WHERE NOT EXISTS (SELECT 1 FROM secrets WHERE id = ${escape(
          selector
        )})
      )
       CTE2;

    UPDATE ${secretsTableNameAsId} SET secret = NULL
      WHERE id = ${escape(selector)} AND secret IS NOT NULL;

    INSERT INTO ${eventsTableNameAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload"
      ) VALUES(
        ${+currentThreadId},
        COALESCE(
          (
            SELECT MAX("threadCounter") FROM ${eventsTableNameAsId}
            WHERE "threadId" = ${+currentThreadId}
          ) + 1,
         0
        ),
        MAX(
          CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER),
          ${+deleteSecretEvent.timestamp}
        ),
        ${escape(deleteSecretEvent.aggregateId)},
        ${+deleteSecretEvent.aggregateVersion},
        ${escape(deleteSecretEvent.type)},
        json(CAST(${serializedPayload} AS BLOB))
      );

    COMMIT;`
    )
    log.debug(`query executed successfully`)
    return true
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? (error.message as string) : ''
    const errorCode =
      error != null && error.code != null ? (error.code as string) : ''

    if (errorMessage.indexOf('transaction within a transaction') > -1) {
      return await deleteSecret(pool, selector)
    }

    try {
      await executeQuery('ROLLBACK;')
    } catch (e) {}

    if (isIntegerOverflowError(errorMessage)) {
      throw new EventstoreFrozenError()
    } else if (errorMessage.endsWith('malformed JSON')) {
      return false
    } else if (
      errorCode.startsWith('SQLITE_CONSTRAINT') &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      return await deleteSecret(pool, selector)
    } else {
      throw error
    }
  }
}

export default deleteSecret
