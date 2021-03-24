import type { ExternalMethods, ReadModelCursor, ReadModelEvent } from './types'
import rawExecuteStatement from './raw-execute-statement'

const RESERVED_EVENT_SIZE = 66 // 3 reserved BIGINT fields with commas
const BATCH_SIZE = 50

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

  const spatialEventsThreadIds: Array<number> = [] //result
  //.filter((entry) => !entry.continuous)
  //.map((entry) => entry.threadId)

  let threadGaps: Array<{
    threadId: number
    firstThreadCounterGap: number
  }> = []

  if (spatialEventsThreadIds.length) {
    console.log('Spatial events thread ids:', spatialEventsThreadIds)
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
    result.map(
      (entry) =>
        ({
          threadCounter: spatialEventsThreadIds.includes(entry.threadId)
            ? threadGaps.find((gap) => gap.threadId === entry.threadId)
                ?.firstThreadCounterGap
            : entry.threadCounter,
          threadId: entry.threadId,
        } as ReadModelEvent)
    )
  )

  const insertEventToTargetEventStore = async (
    event: ReadModelEvent
  ): Promise<void> => {
    const serializedEvent = [
      `${escapeStr(event.aggregateId)},`,
      `${+event.aggregateVersion},`,
      `${escapeStr(event.type)},`,
      escapeStr(JSON.stringify(event.payload != null ? event.payload : null)),
    ].join('')

    const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

    try {
      await rdsDataService.executeStatement({
        resourceArn: eventStoreClusterArn,
        secretArn: eventStoreSecretArn,
        database: 'postgres',
        sql: `
                WITH "cte" AS (
                  UPDATE ${eventStoreDatabaseNameAsId}.${eventStoreThreadsTableAsId} SET
                  "threadCounter" = GREATEST("threadCounter", ${+event.threadCounter} + 1)
                  WHERE "threadId" = ${+event.threadId}
                  RETURNING "threadId"
                )
                INSERT INTO ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId}(
                "threadId",
                "threadCounter",
                "timestamp",
                "aggregateId",
                "aggregateVersion",
                "type",
                "payload",
                "eventSize"
                ) VALUES (
                  (SELECT "threadId" FROM "cte" LIMIT 1),
                  ${+event.threadCounter},
                  ${+event.timestamp},
                  ${serializedEvent},
                  ${byteLength}
                )
              `,
      })
    } catch (error) {
      const errorMessage: string = error.message
      if (
        !/duplicate key value violates unique constraint/.test(errorMessage)
      ) {
        throw error
      }
    }
  }

  let nextCursor: ReadModelCursor = inputCursor
  let localContinue = true
  let lastError: Error | null = null
  while (true) {
    let appliedEventsCount = 0
    try {
      const { cursor: newCursor, events } = await eventstoreAdapter.loadEvents({
        eventTypes: null,
        eventsSizeLimit: 65536000,
        limit: BATCH_SIZE,
        cursor: nextCursor,
      })

      const eventPromises: Array<Promise<void>> = []
      for (const event of events) {
        eventPromises.push(insertEventToTargetEventStore(event))
      }
      await Promise.all(eventPromises)

      nextCursor = newCursor
      appliedEventsCount = events.length
      if (getVacantTimeInMillis() < 0) {
        localContinue = false
        break
      }
    } catch (error) {
      lastError = error
    }

    const isBuildSuccess = lastError == null && appliedEventsCount > 0

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
