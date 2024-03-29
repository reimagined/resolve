import type { AdapterPool } from './types'
import type {
  EventStoreDescription,
  EventThreadData,
  DescribeOptions,
  Cursor,
} from '@resolve-js/eventstore-base'
import assert from 'assert'
import { threadArrayToCursor } from '@resolve-js/eventstore-base'

const describe = async (
  pool: AdapterPool,
  options?: DescribeOptions
): Promise<EventStoreDescription> => {
  const {
    executeStatement,
    secretsTableName,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
  } = pool

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableName = `${eventsTableName}-freeze`
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)

  let cursor: Cursor | undefined = undefined

  if (options && options.calculateCursor) {
    const threads = (await executeStatement(
      `SELECT "threadId", "threadCounter" FROM ${databaseNameAsId}.${threadsTableAsId} ORDER BY "threadId" ASC`
    )) as Array<{
      threadId: EventThreadData['threadId']
      threadCounter: EventThreadData['threadCounter']
    }>

    const threadArray = threads.map((row) => {
      return +row.threadCounter
    })
    cursor = threadArrayToCursor(threadArray)
  }

  const estimateCounts = options?.estimateCounts ?? false

  const rows = await executeStatement(`SELECT
    ${
      estimateCounts
        ? `(SELECT reltuples::bigint FROM pg_class WHERE oid = ${escape(
            databaseNameAsId + '.' + eventsTableNameAsId
          )}::regclass)`
        : `(SELECT COUNT(*) FROM ${databaseNameAsId}.${eventsTableNameAsId})`
    } AS "eventCount",
    ${
      estimateCounts
        ? `(SELECT reltuples::bigint FROM pg_class WHERE oid = ${escape(
            databaseNameAsId + '.' + secretsTableNameAsId
          )}::regclass)`
        : `(SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId})`
    } AS "secretCount",
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId} WHERE "secret" IS NOT NULL) AS "setSecretCount",
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId} WHERE "secret" IS NULL) AS "deletedSecretCount", 
    (SELECT "timestamp" FROM ${databaseNameAsId}.${eventsTableNameAsId} ORDER BY "timestamp" DESC LIMIT 1) AS "lastEventTimestamp",
    (SELECT EXISTS (SELECT FROM "information_schema"."tables" WHERE "table_schema" = ${escape(
      databaseName
    )} AND "table_name" = ${escape(freezeTableName)})) AS "isFrozen"
    `)

  assert.strictEqual(rows.length, 1, 'Wrong number of description rows')
  const row = rows[0]
  return {
    eventCount: +row.eventCount,
    secretCount: +row.secretCount,
    setSecretCount: +row.setSecretCount,
    deletedSecretCount: +row.deletedSecretCount,
    lastEventTimestamp: +row.lastEventTimestamp,
    isFrozen: !!row.isFrozen,
    cursor: cursor,
    resourceNames: {
      eventsTableName,
      databaseName,
    },
  }
}

export default describe
