import { getLog } from './get-log'
import { AdapterPool } from './types'
import {
  EventstoreFrozenError,
  InputEvent,
  makeSetSecretEvent,
  THREAD_COUNT,
} from '@resolve-js/eventstore-base'

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const { database, eventsTableName, secretsTableName, escape, escapeId } = pool

  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`database: ${database}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const secretsTableNameAsId = escapeId(secretsTableName)
  const currentThreadId = Math.floor(Math.random() * THREAD_COUNT)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)

  const setSecretEvent: InputEvent = makeSetSecretEvent(selector)
  const serializedPayload = escape(JSON.stringify(setSecretEvent.payload))

  try {
    log.debug(`executing SQL query`)
    await database.exec(
      `BEGIN IMMEDIATE;

      SELECT ABS("CTE"."EventStoreIsFrozen") FROM (
        SELECT 0 AS "EventStoreIsFrozen"
      UNION ALL
        SELECT -9223372036854775808 AS "EventStoreIsFrozen"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${freezeTableNameAsString}
      ) CTE;
      INSERT INTO ${secretsTableNameAsId}(
        "idx", 
        "id", 
        "secret"
        ) VALUES (
         COALESCE(
          (SELECT MAX("idx") FROM ${secretsTableNameAsId}) + 1,
          0
         ),
         ${escape(selector)},
         ${escape(secret)}
       );
       
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
          ${+setSecretEvent.timestamp}
        ),
        ${escape(setSecretEvent.aggregateId)},
        ${+setSecretEvent.aggregateVersion},
        ${escape(setSecretEvent.type)},
        json(CAST(${serializedPayload} AS BLOB))
      );

       COMMIT;`
    )
    log.debug(`query executed successfully`)
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''
    const errorCode = error != null && error.code != null ? error.code : ''

    if (errorMessage.indexOf('transaction within a transaction') > -1) {
      return await setSecret(pool, selector, secret)
    }

    try {
      await database.exec('ROLLBACK;')
    } catch (e) {}

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new EventstoreFrozenError()
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      return await setSecret(pool, selector, secret)
    } else {
      throw error
    }
  }
}

export default setSecret
