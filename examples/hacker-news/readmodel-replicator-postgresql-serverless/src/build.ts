import type {
  EventstoreAdapterLike,
  ExternalMethods,
  ReadModelCursor,
  ReadModelEvent,
} from './types'
import rawExecuteStatement from './raw-execute-statement'
import {
  EventThreadData,
  EventsWithCursor,
  SET_SECRET_EVENT_TYPE,
  DELETE_SECRET_EVENT_TYPE,
} from '@resolve-js/eventstore-base'

const RESERVED_EVENT_SIZE = 66 // 3 reserved BIGINT fields with commas
const BATCH_SIZE = 100
const BATCH_SIZE_SECRETS = 50
const MAX_EVENTS_BATCH_BYTE_SIZE = 32768

type EventWithSize = {
  event: ReadModelEvent
  size: number
  serialized: string
}

const optimizeSql = (sql: string): string => {
  return sql
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join('\n')
}

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis
) => {
  const {
    targetEventStore,
    escapeId,
    escapeStr,
    rdsDataService,
    coercer,
  } = basePool

  const {
    dbClusterOrInstanceArn: eventStoreClusterArn,
    awsSecretStoreArn: eventStoreSecretArn,
    databaseName: eventStoreDatabaseName,
    eventsTableName: eventStoreEventsTableName = 'events',
    secretsTableName: eventStoreSecretsTableName = 'secrets',
  } = targetEventStore

  const eventStoreDatabaseNameAsId = escapeId(eventStoreDatabaseName)
  const eventStoreDatabaseNameAsString = escapeStr(eventStoreDatabaseName)
  const eventStorePauseTableNameAsString = escapeStr(
    `${eventStoreEventsTableName}-pause`
  )
  const eventStoreEventsTableAsId = escapeId(eventStoreEventsTableName)
  const eventStoreThreadsTableAsId = escapeId(
    `${eventStoreEventsTableName}-threads`
  )
  const eventStoreSecretsTableNameAsId = escapeId(eventStoreSecretsTableName)

  const pauseCheckResult = (await rawExecuteStatement(
    rdsDataService,
    eventStoreClusterArn,
    eventStoreSecretArn,
    coercer,
    `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE  table_schema = ${eventStoreDatabaseNameAsString}
          AND    table_name   = ${eventStorePauseTableNameAsString}
         ) AS "pauseCheck"
    `
  )) as Array<{
    pauseCheck: boolean
  }>

  if (pauseCheckResult.length && pauseCheckResult[0].pauseCheck) return

  const result = (await rawExecuteStatement(
    rdsDataService,
    eventStoreClusterArn,
    eventStoreSecretArn,
    coercer,
    `SELECT "T"."threadId" AS "threadId", "T"."threadCounter" AS "threadCounter", (
      SELECT CASE WHEN Count("E".*) = "T"."threadCounter" THEN 1 ELSE 0 END
      FROM ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId} "E"
      WHERE "E"."threadId" = "T"."threadId"
    ) AS "continuous"
    FROM ${eventStoreDatabaseNameAsId}.${eventStoreThreadsTableAsId} "T"
    ORDER BY "T"."threadId" ASC
    `
  )) as Array<{
    threadCounter: number
    threadId: number
    continuous: number
  }>

  const spatialEventsThreadIds: Array<number> = result
    .filter((entry) => !entry.continuous)
    .map((entry) => entry.threadId)

  let threadGaps: Array<{
    threadId: number
    firstThreadCounterGap: number
  }> = []

  if (spatialEventsThreadIds.length) {
    threadGaps = (await rawExecuteStatement(
      rdsDataService,
      eventStoreClusterArn,
      eventStoreSecretArn,
      coercer,
      spatialEventsThreadIds
        .map(
          (threadId) => `(
       SELECT "nr"."threadCounter" + 1 AS "firstThreadCounterGap", ${+threadId} AS "threadId" 
      FROM (
        SELECT "E"."threadCounter" AS "threadCounter", lead("E"."threadCounter") over (order by "E"."threadCounter") as "next_nr"
        FROM ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId} "E"
        WHERE "E"."threadId" = ${+threadId} AND
        "E"."threadCounter" > ${
          result.find((entry) => entry.threadId === threadId)?.threadCounter
        } - ${BATCH_SIZE}
      ) "nr"
      WHERE "nr"."threadCounter" + 1 <> "nr"."next_nr"
      ORDER BY "firstThreadCounterGap"
      LIMIT 1
    )`
        )
        .join(' UNION ALL ')
    )) as Array<{
      threadId: number
      firstThreadCounterGap: number
    }>
  }

  const inputCursor: ReadModelCursor = eventstoreAdapter.getNextCursor(
    null,
    result
      .map(
        (entry) =>
          ({
            threadCounter:
              (threadGaps.find((gap) => gap.threadId === entry.threadId)
                ?.firstThreadCounterGap ?? entry.threadCounter) - 1,
            threadId: entry.threadId,
          } as EventThreadData)
      )
      .filter((entry) => entry.threadCounter >= 0)
  )

  console.log('Input cursor: ', inputCursor)

  const calculateEventWithSize = (event: ReadModelEvent): EventWithSize => {
    const serializedEvent = [
      `${escapeStr(event.aggregateId)},`,
      `${+event.aggregateVersion},`,
      `${escapeStr(event.type)},`,
      escapeStr(JSON.stringify(event.payload != null ? event.payload : null)),
    ].join('')

    const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

    return {
      event,
      size: byteLength,
      serialized: serializedEvent,
    }
  }

  let appliedEventsCount = 0

  const insertEventsBatchToTargetEventStore = async (
    eventsWithSize: EventWithSize[]
  ): Promise<void> => {
    const maxThreadCounters: Record<number, number> = {}
    for (const eventWithSize of eventsWithSize) {
      if (maxThreadCounters[eventWithSize.event.threadId] === undefined)
        maxThreadCounters[eventWithSize.event.threadId] =
          eventWithSize.event.threadCounter
      else
        maxThreadCounters[eventWithSize.event.threadId] = Math.max(
          maxThreadCounters[eventWithSize.event.threadId],
          eventWithSize.event.threadCounter
        )
    }

    const updateThreadsExpression: string[] = []
    for (let [threadId, maxThreadCounter] of Object.entries(
      maxThreadCounters
    )) {
      updateThreadsExpression.push(`
      "cte_${threadId}" AS (
                  UPDATE ${eventStoreDatabaseNameAsId}.${eventStoreThreadsTableAsId} SET
                  "threadCounter" = GREATEST("threadCounter", ${maxThreadCounter} + 1)
                  WHERE "threadId" = ${threadId}
                  RETURNING "threadId"
                )`)
    }

    const inserts: string[] = []
    for (const eventWithSize of eventsWithSize) {
      inserts.push(`
      ((SELECT "threadId" FROM "cte_${eventWithSize.event.threadId}" LIMIT 1),
                  ${eventWithSize.event.threadCounter},
                  ${eventWithSize.event.timestamp},
                  ${eventWithSize.serialized},
                  ${eventWithSize.size})`)
    }

    let shouldRetry = false
    do {
      shouldRetry = false
      try {
        await rdsDataService.executeStatement({
          resourceArn: eventStoreClusterArn,
          secretArn: eventStoreSecretArn,
          database: 'postgres',
          sql: optimizeSql(`WITH ${updateThreadsExpression.join(',')}
                INSERT INTO ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId}(
                "threadId",
                "threadCounter",
                "timestamp",
                "aggregateId",
                "aggregateVersion",
                "type",
                "payload",
                "eventSize"
                ) VALUES 
                ${inserts.join(',')}
                ON CONFLICT DO NOTHING
              `),
        })
        appliedEventsCount += eventsWithSize.length
      } catch (error) {
        const errorMessage: string = error.message
        if (/deadlock detected/.test(errorMessage)) {
          console.error(errorMessage, '... retrying')
          shouldRetry = true
        } else {
          throw error
        }
      }
    } while (shouldRetry)
  }

  let nextCursor: ReadModelCursor = inputCursor
  let localContinue = true
  let lastError: Error | null = null
  while (true) {
    appliedEventsCount = 0
    let appliedSecretsCount = 0

    try {
      const { cursor: newCursor, events } = (await eventstoreAdapter.loadEvents(
        {
          eventTypes: null,
          eventsSizeLimit: 65536000,
          limit: BATCH_SIZE,
          cursor: nextCursor,
        }
      )) as EventsWithCursor

      const insertSecret = async (secretId: string) => {
        const secret = await secretManager.getSecret(secretId)
        if (secret) {
          await rdsDataService.executeStatement({
            resourceArn: eventStoreClusterArn,
            secretArn: eventStoreSecretArn,
            database: 'postgres',
            sql: `INSERT INTO ${eventStoreDatabaseNameAsId}.${eventStoreSecretsTableNameAsId}(
                  "id",
                  "secret"
                ) VALUES(
                  ${escapeStr(secretId)},
                  ${escapeStr(secret)}
                ) ON CONFLICT DO NOTHING`,
          })
        }
      }

      const deleteSecret = async (secretId: string) => {
        await rdsDataService.executeStatement({
          resourceArn: eventStoreClusterArn,
          secretArn: eventStoreSecretArn,
          database: 'postgres',
          sql: `DELETE FROM ${eventStoreDatabaseNameAsId}.${eventStoreSecretsTableNameAsId}
                WHERE "id"=${escapeStr(secretId)}`,
        })
      }

      const secretsToInsert: string[] = []
      const secretsToDelete: string[] = []

      const secretManager = await eventstoreAdapter.getSecretsManager()

      for (const event of events) {
        if (event.type === SET_SECRET_EVENT_TYPE) {
          secretsToInsert.push(event.payload.id)
        } else if (event.type === DELETE_SECRET_EVENT_TYPE) {
          secretsToDelete.push(event.payload.id)
        }
      }
      await Promise.all(secretsToInsert.map((id) => insertSecret(id)))
      await Promise.all(secretsToDelete.map((id) => deleteSecret(id)))

      const eventPromises: Array<Promise<void>> = []

      let currentBatchSize = 0
      const currentEventsBatch: EventWithSize[] = []

      for (const event of events) {
        const eventWithSize = calculateEventWithSize(event)

        if (eventWithSize.size > MAX_EVENTS_BATCH_BYTE_SIZE) {
          eventPromises.push(
            insertEventsBatchToTargetEventStore([eventWithSize])
          )
          continue
        }

        const newCurrentBatchSize = currentBatchSize + eventWithSize.size
        if (newCurrentBatchSize > MAX_EVENTS_BATCH_BYTE_SIZE) {
          eventPromises.push(
            insertEventsBatchToTargetEventStore(currentEventsBatch)
          )
          currentEventsBatch.length = 0
          currentBatchSize = 0
        }
        currentBatchSize += eventWithSize.size
        currentEventsBatch.push(eventWithSize)
      }

      if (currentEventsBatch.length) {
        eventPromises.push(
          insertEventsBatchToTargetEventStore(currentEventsBatch)
        )
      }

      await Promise.all(eventPromises)

      nextCursor = newCursor
    } catch (error) {
      lastError = error
      console.error('RDS error:', lastError)
    }

    const isBuildSuccess =
      lastError == null && (appliedEventsCount > 0 || appliedSecretsCount > 0)

    if (!isBuildSuccess) console.error('Build did not succeed!')

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
    } else {
      if (isBuildSuccess) {
        await next()
      }
      break
    }
  }
}

export default build
