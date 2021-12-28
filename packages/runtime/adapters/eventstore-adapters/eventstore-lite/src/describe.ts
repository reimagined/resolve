import type { AdapterPool } from './types'
import type {
  EventStoreDescription,
  EventThreadData,
  DescribeOptions,
  Cursor,
} from '@resolve-js/eventstore-base'
import assert from 'assert'
import { THREAD_COUNT, threadArrayToCursor } from '@resolve-js/eventstore-base'

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
  } = pool

  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableName = `${eventsTableName}-freeze`

  let cursor: Cursor | undefined = undefined

  if (options && options.calculateCursor) {
    const existingThreads = (await executeStatement(`
    SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`)) as Array<{
      threadId: EventThreadData['threadId']
      threadCounter: EventThreadData['threadCounter']
    }>

    const threadCounters = new Array<number>(THREAD_COUNT)
    threadCounters.fill(-1)

    for (const existingThread of existingThreads) {
      threadCounters[existingThread.threadId] = existingThread.threadCounter
    }
    for (let i = 0; i < threadCounters.length; ++i) {
      threadCounters[i]++
    }

    cursor = threadArrayToCursor(threadCounters)
  }

  const rows = await executeStatement(`SELECT
    (SELECT COUNT(*) FROM ${eventsTableNameAsId}) AS "eventCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId}) AS "secretCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId} WHERE "secret" IS NOT NULL) AS "setSecretCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId} WHERE "secret" IS NULL) AS "deletedSecretCount", 
    (SELECT "timestamp" FROM ${eventsTableNameAsId} ORDER BY "timestamp" DESC LIMIT 1) AS "lastEventTimestamp",
    (SELECT EXISTS (SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" = ${escape(
      freezeTableName
    )})) AS "isFrozen"
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
  }
}

export default describe
