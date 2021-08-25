import { ReadModelEvent } from '../../readmodel-base/types'
import type {
  PassthroughErrorInstance,
  ExternalMethods,
  ReadModelCursor,
  ReadModelProcedureLedger,
  ProcedureResult,
  EventThreadData,
} from './types'

const serializeError = (error: Error & { code: number }) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const buildInit: (
  currentPool: {
    ledgerTableNameAsId: string
    databaseNameAsId: string
    eventTypes: Array<string> | null
    inputCursor: ReadModelCursor
    readModelLedger: ReadModelProcedureLedger
    xaKey: string
  },
  ...args: Parameters<ExternalMethods['build']>
) => ReturnType<ExternalMethods['build']> = async (
  currentPool,
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter
) => {
  const pool = { ...basePool, ...currentPool }
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    xaKey,
  } = pool

  const rootSavePointId = generateGuid(xaKey, 'ROOT')

  await inlineLedgerRunQuery(
    `BEGIN TRANSACTION;
     SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     SAVEPOINT ${rootSavePointId};
     WITH "CTE" AS (
      SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        AND "XaKey" = ${escapeStr(xaKey)}
        AND "IsPaused" = FALSE
        AND "Errors" IS NULL
        FOR NO KEY UPDATE NOWAIT
    )
      SELECT 1/Count("CTE"."XaKey") AS "NonZero" FROM "CTE";
    `,
    true
  )

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  try {
    const handler = await modelInterop.acquireInitHandler(store)
    if (handler != null) {
      await handler()
    }
    // TODO Init via plv8

    await inlineLedgerRunQuery(
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "SuccessEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escapeStr(readModelName)};

       COMMIT;
      `
    )

    await next()
  } catch (error) {
    if (error instanceof PassthroughError) {
      throw error
    }

    await inlineLedgerRunQuery(
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "Errors" = jsonb_insert(
         COALESCE("Errors", jsonb('[]')),
         CAST(('{' || jsonb_array_length(COALESCE("Errors", jsonb('[]'))) || '}') AS TEXT[]),
         jsonb(${escapeStr(JSON.stringify(serializeError(error)))})
       ),
       "FailedEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escapeStr(readModelName)};

       COMMIT;
      `
    )
  }
}

const buildEvents: (
  currentPool: {
    ledgerTableNameAsId: string
    databaseNameAsId: string
    eventTypes: Array<string> | null
    inputCursor: ReadModelCursor
    readModelLedger: ReadModelProcedureLedger
    xaKey: string
    metricData: any
  },
  ...args: Parameters<ExternalMethods['build']>
) => ReturnType<ExternalMethods['build']> = async (
  currentPool,
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis,
  buildInfo
) => {
  const pool = { ...basePool, ...currentPool }
  const {
    readModelLedger: { IsProcedural: inputIsProcedural },
    PassthroughError,
    checkEventsContinuity,
    inlineLedgerRunQuery,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    metricData,
    monitoring,
    inputCursor,
    eventTypes,
    escapeId,
    xaKey,
  } = pool
  const { eventsWithCursors } = buildInfo
  let isProcedural = inputIsProcedural
  const isContinuousMode =
    typeof eventstoreAdapter.getCursorUntilEventTypes === 'function'
  const getContinuousLatestCursor = async (
    cursor: ReadModelCursor,
    events: Array<EventThreadData>,
    eventTypes: Array<string> | null
  ) => {
    let nextCursor = await eventstoreAdapter.getNextCursor(cursor, events)
    if (isContinuousMode && eventTypes != null) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = await eventstoreAdapter.getCursorUntilEventTypes!(
        nextCursor,
        eventTypes
      )
    }
    return nextCursor
  }

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError = null
  let localContinue = true
  let cursor = inputCursor

  const groupMonitoring =
    monitoring != null
      ? monitoring
          .group({ Part: 'ReadModelProjection' })
          .group({ ReadModel: readModelName })
      : null

  const firstEventsLoadStartTimestamp = Date.now()
  let eventsApplyStartTimestamp = Date.now()
  let eventCount = 0
  let projectionApplyTime = 0

  const hotEvents: Array<ReadModelEvent> | null =
    isContinuousMode &&
    Array.isArray(eventsWithCursors) &&
    checkEventsContinuity(inputCursor, eventsWithCursors)
      ? eventsWithCursors.map(({ event }) => event)
      : null

  const loadEventsWithMonitoring = (
    cursorPromise: Promise<ReadModelCursor>,
    limit: number,
    initialTimestamp: number
  ) =>
    Promise.resolve(cursorPromise)
      .then((cursor) =>
        eventstoreAdapter.loadEvents({
          eventTypes,
          eventsSizeLimit: 65536 * limit,
          limit,
          cursor,
        })
      )
      .then((result) => {
        const loadDuration = Date.now() - initialTimestamp

        const events = result != null ? result.events : []

        if (groupMonitoring != null && events.length > 0) {
          groupMonitoring.duration(
            'EventLoad',
            loadDuration / events.length,
            events.length
          )
        }

        return events
      })

  let eventsPromise =
    hotEvents == null
      ? loadEventsWithMonitoring(
          Promise.resolve(cursor),
          100,
          firstEventsLoadStartTimestamp
        )
      : Promise.resolve(hotEvents)

  const eventstoreLocalTableNamePromise = (async () => {
    let resourceNames = null
    try {
      void ({ resourceNames } = !isContinuousMode
        ? await eventstoreAdapter.describe()
        : { resourceNames: null })
    } catch (err) {}

    if (
      resourceNames == null ||
      resourceNames?.eventsTableName == null ||
      resourceNames?.databaseName == null
    ) {
      return null
    }

    const databaseNameAsId = escapeId(resourceNames.databaseName)
    const eventsTableNameAsId = escapeId(resourceNames.eventsTableName)

    try {
      const immediateLastEvent = (await eventsPromise).slice(-1)[0]
      await inlineLedgerRunQuery(`
          WITH "CTE" AS (
            SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
            WHERE "threadId" = ${+immediateLastEvent.threadId}
            AND "threadCounter" = ${+immediateLastEvent.threadCounter}
            AND "timestamp" = ${+immediateLastEvent.timestamp}
            AND "aggregateId" = ${escapeStr(immediateLastEvent.aggregateId)}
            AND "aggregateVersion" = ${+immediateLastEvent.aggregateVersion}
            AND "type" = ${escapeStr(immediateLastEvent.type)}
            AND "payload" = ${escapeStr(
              JSON.stringify(immediateLastEvent.payload)
            )}
          )
          SELECT 1/Count("CTE"."*") AS "NonZero" FROM "CTE"
        `)

      return resourceNames.eventsTableName
    } catch (err) {
      return null
    }
  })()

  let rootSavePointId = generateGuid(xaKey, 'ROOT')

  await inlineLedgerRunQuery(
    `BEGIN TRANSACTION;
     SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     SAVEPOINT ${rootSavePointId};
     WITH "CTE" AS (
      SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        AND "XaKey" = ${escapeStr(xaKey)}
        AND "IsPaused" = FALSE
        AND "Errors" IS NULL
        FOR NO KEY UPDATE NOWAIT
    )
      SELECT 1/Count("CTE"."XaKey") AS "NonZero" FROM "CTE";
    `,
    true
  )

  let [events, eventstoreLocalTableName] = await Promise.all([
    eventsPromise,
    eventstoreLocalTableNamePromise,
  ])
  let isLocalEventsSkipped = false

  for (metricData.eventLoopCount = 0; true; metricData.eventLoopCount++) {
    if (events.length === 0) {
      throw new PassthroughError(false)
    }
    let nextCursorPromise: Promise<ReadModelCursor> = getContinuousLatestCursor(
      cursor,
      events,
      eventTypes
    )
    let appliedEventsCount = 0
    let regularWorkflow = true

    if (isProcedural) {
      try {
        let procedureResult: Array<{ Result: ProcedureResult }> | null = null
        try {
          metricData.insideProjection = true
          procedureResult = (await inlineLedgerRunQuery(
            `SELECT ${databaseNameAsId}.${escapeId(
              `PROC-${readModelName}`
            )}(${escapeStr(
              JSON.stringify({
                maxExecutionTime: getVacantTimeInMillis(),
                ...(eventstoreLocalTableName != null
                  ? { eventstoreLocalTableName }
                  : { events }),
              })
            )}) AS "Result"`
          )) as Array<{ Result: ProcedureResult }>
        } finally {
          metricData.insideProjection = false
        }

        if (procedureResult?.[0]?.Result == null) {
          throw new Error(`Procedure was not able to be launched`)
        }
        const {
          appliedEventsThreadData,
          successEvent,
          failureEvent,
          failureError,
          appliedCount,
          status,
        } = procedureResult[0].Result
        if (status === 'DEPENDENCY_ERROR') {
          if (failureError?.message != null || failureError?.stack != null) {
            throw failureError
          } else {
            throw new Error(`${failureError}`)
          }
        }

        appliedEventsCount = appliedCount
        eventCount += appliedCount
        if (status === 'OK_PARTIAL' || status === 'CUSTOM_ERROR') {
          nextCursorPromise = getContinuousLatestCursor(
            cursor,
            appliedEventsThreadData,
            eventTypes
          )
        }
        if (status === 'OK_ALL' || status === 'OK_PARTIAL') {
          lastSuccessEvent = successEvent
        } else if (status === 'CUSTOM_ERROR') {
          lastFailedEvent = failureEvent
          lastError = failureError
        }

        if (getVacantTimeInMillis() < 0) {
          localContinue = false
        }

        regularWorkflow = false
        if (eventstoreLocalTableName != null) {
          isLocalEventsSkipped = true
        }
      } catch (err) {
        isProcedural = false

        // eslint-disable-next-line no-console
        console.warn(
          `Inline procedure execution failed for reason: ${JSON.stringify(
            serializeError(err)
          )}`
        )

        await inlineLedgerRunQuery(`ROLLBACK TO SAVEPOINT ${rootSavePointId};`)

        nextCursorPromise = getContinuousLatestCursor(
          cursor,
          events,
          eventTypes
        )
      }
    }

    const eventsLoadStartTimestamp = Date.now()
    if (regularWorkflow && isLocalEventsSkipped) {
      events = await loadEventsWithMonitoring(
        nextCursorPromise,
        100,
        eventsLoadStartTimestamp
      )
      isLocalEventsSkipped = false
    }

    if (regularWorkflow || eventstoreLocalTableName == null) {
      eventsPromise = loadEventsWithMonitoring(
        nextCursorPromise,
        1000,
        eventsLoadStartTimestamp
      )
    }

    if (regularWorkflow) {
      try {
        for (const event of events) {
          const savePointId = generateGuid(xaKey, `${appliedEventsCount}`)
          try {
            const handler = await modelInterop.acquireEventHandler(store, event)
            if (handler != null) {
              await inlineLedgerRunQuery(`SAVEPOINT ${savePointId}`)

              const projectionApplyStartTimestamp = Date.now()
              try {
                metricData.insideProjection = true
                await handler()
                eventCount++
              } finally {
                metricData.insideProjection = false
              }

              projectionApplyTime += Date.now() - projectionApplyStartTimestamp

              await inlineLedgerRunQuery(`RELEASE SAVEPOINT ${savePointId}`)
              lastSuccessEvent = event
            }
            appliedEventsCount++

            if (getVacantTimeInMillis() < 0) {
              nextCursorPromise = getContinuousLatestCursor(
                cursor,
                events.slice(0, appliedEventsCount),
                eventTypes
              )
              localContinue = false
              break
            }
          } catch (error) {
            if (error instanceof PassthroughError) {
              throw error
            }

            nextCursorPromise = getContinuousLatestCursor(
              cursor,
              events.slice(0, appliedEventsCount),
              eventTypes
            )

            await inlineLedgerRunQuery(
              `ROLLBACK TO SAVEPOINT ${savePointId};
              RELEASE SAVEPOINT ${savePointId}
            `
            )

            lastFailedEvent = event
            lastError = error
            break
          }
        }
      } catch (originalError) {
        if (originalError instanceof PassthroughError) {
          throw originalError
        }

        nextCursorPromise = Promise.resolve(cursor)
        appliedEventsCount = 0
        const composedError = new Error(
          `Fatal inline ledger building error: ${originalError.message}`
        )
        composedError.stack = `${composedError.stack}${originalError.stack}`
        lastError = composedError
        lastSuccessEvent = null
        lastFailedEvent = null
        await inlineLedgerRunQuery(
          `ROLLBACK TO SAVEPOINT ${rootSavePointId};
          RELEASE SAVEPOINT ${rootSavePointId}
        `
        )
      }
    }
    const nextCursor = await nextCursorPromise
    if (lastError == null) {
      await inlineLedgerRunQuery(
        `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId} SET 
         ${
           lastSuccessEvent != null
             ? `"SuccessEvent" = ${escapeStr(
                 JSON.stringify(lastSuccessEvent)
               )},`
             : ''
         } 
         "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)};

         COMMIT;
        `
      )
    } else {
      await inlineLedgerRunQuery(
        `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
         SET "Errors" = jsonb_insert(
           COALESCE("Errors", jsonb('[]')),
           CAST(('{' || jsonb_array_length(COALESCE("Errors", jsonb('[]'))) || '}') AS TEXT[]),
           jsonb(${escapeStr(JSON.stringify(serializeError(lastError)))})
         ),
         ${
           lastFailedEvent != null
             ? `"FailedEvent" = ${escapeStr(JSON.stringify(lastFailedEvent))},`
             : ''
         }
         ${
           lastSuccessEvent != null
             ? `"SuccessEvent" = ${escapeStr(
                 JSON.stringify(lastSuccessEvent)
               )},`
             : ''
         }
         "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)};

         COMMIT;
        `
      )
    }

    if (groupMonitoring != null && eventCount > 0) {
      const applyDuration = Date.now() - eventsApplyStartTimestamp

      groupMonitoring.rate(
        'ReadModelFeedingRate',
        eventCount,
        applyDuration / 1000
      )

      groupMonitoring.duration(
        'EventApply',
        applyDuration / eventCount,
        eventCount
      )

      groupMonitoring.duration(
        'EventProjectionApply',
        projectionApplyTime / eventCount,
        eventCount
      )
    }

    eventCount = 0
    eventsApplyStartTimestamp = Date.now()
    projectionApplyTime = 0

    const isBuildSuccess = lastError == null && appliedEventsCount > 0
    cursor = nextCursor

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      rootSavePointId = generateGuid(xaKey, 'ROOT')

      await inlineLedgerRunQuery(
        `BEGIN TRANSACTION;
        SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
        SAVEPOINT ${rootSavePointId};
        WITH "CTE" AS (
          SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escapeStr(readModelName)}
            AND "XaKey" = ${escapeStr(xaKey)}
            AND "IsPaused" = FALSE
            AND "Errors" IS NULL
            FOR NO KEY UPDATE NOWAIT
        )
          SELECT 1/Count("CTE"."XaKey") AS "NonZero" FROM "CTE";
        `,
        true
      )

      events = await eventsPromise
    } else {
      if (isBuildSuccess) {
        await next()
      }

      throw new PassthroughError(false)
    }
  }
}

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis,
  buildInfo
) => {
  const { eventsWithCursors, ...inputMetricData } = buildInfo
  const metricData = {
    ...inputMetricData,
    pureLedgerTime: 0,
    insideProjection: false,
  }
  void eventsWithCursors

  const {
    PassthroughError,
    inlineLedgerRunQuery: ledgerQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
    generateGuid,
    monitoring,
  } = basePool

  const now = Date.now()

  const hasSendTime =
    metricData.sendTime != null && metricData.sendTime.constructor === Number

  const groupMonitoring =
    monitoring != null
      ? monitoring
          .group({ Part: 'ReadModelProjection' })
          .group({ ReadModel: readModelName })
      : null

  if (hasSendTime) {
    for (const innerMonitoring of [monitoring, groupMonitoring]) {
      if (innerMonitoring != null) {
        innerMonitoring.duration('EventDelivery', now - metricData.sendTime)
      }
    }
  }

  const inlineLedgerRunQuery: typeof ledgerQuery = Object.assign(
    async (...args: any[]): Promise<any> => {
      const inlineLedgerStartTimestamp = Date.now()
      try {
        return await (ledgerQuery as any)(...args)
      } finally {
        if (!metricData.insideProjection) {
          metricData.pureLedgerTime += Date.now() - inlineLedgerStartTimestamp
        }
      }
    },
    ledgerQuery
  )

  try {
    basePool.activePassthrough = true
    const databaseNameAsId = escapeId(schemaName)
    const databaseNameAsStr = escapeStr(schemaName)
    const ledgerTableNameAsId = escapeId(
      `${tablePrefix}__${schemaName}__LEDGER__`
    )
    const trxTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__TRX__`)

    const firstRandom = Math.random()
    let lastRandom: number | null = null
    // More entropy via branch misprediction and more context changes
    for (let index = 0; index < Math.floor(firstRandom * 50) + 1; index++) {
      lastRandom = Math.random()
    }
    const xaKey = generateGuid(
      `${Date.now()}${firstRandom}${lastRandom}${process.pid}`
    )

    const rows = (await inlineLedgerRunQuery(
      `WITH "MaybeAcquireLock" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         AND "IsPaused" = FALSE
         AND "Errors" IS NULL
         FOR NO KEY UPDATE NOWAIT
       ), "CleanTrx" AS (
        DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
        WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
        RETURNING *
      ), "InsertTrx" AS (
        INSERT INTO ${databaseNameAsId}.${trxTableNameAsId}(
          "Timestamp", "XaKey", "XaValue"
        ) VALUES (
          CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT), 
          ${escapeStr(xaKey)},
          CAST(pg_backend_pid() AS VARCHAR(190))
        )
        RETURNING *
      ), "UpdateTrx" AS (
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "XaKey" = ${escapeStr(xaKey)}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        AND CAST(COALESCE((SELECT LEAST(Count("InsertTrx".*), 0) FROM "InsertTrx"), 0) AS BIGINT) = 0
        AND CAST(COALESCE((SELECT LEAST(Count("CleanTrx".*), 0) FROM "CleanTrx"), 0) AS BIGINT) = 0
        AND (SELECT Count("MaybeAcquireLock".*) FROM "MaybeAcquireLock") = 1
        AND "IsPaused" = FALSE
        AND "Errors" IS NULL
        RETURNING *
      )
      SELECT "UpdateTrx".*, (
        SELECT Count(*) FROM information_schema.routines
        WHERE routines.specific_schema=${databaseNameAsStr} AND
        routines.routine_name = ${escapeStr(`PROC-${readModelName}`)}
      ) > 0 AS "IsProcedural"
      FROM "UpdateTrx"
      `
    )) as Array<ReadModelProcedureLedger>

    let readModelLedger = rows.length === 1 ? rows[0] : null
    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError(false)
    }

    const eventTypes =
      readModelLedger.EventTypes != null ? readModelLedger.EventTypes : null

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    const cursor =
      readModelLedger.Cursor != null ? readModelLedger.Cursor : null

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    const currentPool = {
      ledgerTableNameAsId,
      databaseNameAsId,
      eventTypes,
      inputCursor: cursor,
      readModelLedger,
      metricData,
      xaKey,
    }

    const buildMethod = cursor == null ? buildInit : buildEvents
    await buildMethod(
      currentPool,
      basePool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )
  } catch (error) {
    if (!(error instanceof PassthroughError)) {
      throw error
    }

    const passthroughError = error as PassthroughErrorInstance

    try {
      await inlineLedgerRunQuery(`ROLLBACK`)
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }

    if (passthroughError.isRetryable) {
      await next()
    }
  } finally {
    basePool.activePassthrough = false

    for (const innerMonitoring of [monitoring, groupMonitoring]) {
      if (innerMonitoring != null) {
        innerMonitoring.duration('Ledger', metricData.pureLedgerTime)
      }
    }
  }
}

export default build
