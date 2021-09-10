import type {
  PassthroughErrorInstance,
  ExternalMethods,
  ReadModelCursor,
  ReadModelLedger,
  ReadModelEvent,
} from './types'

const RDS_TRANSACTION_FAILED_KEY = 'RDS_TRANSACTION_FAILED_KEY'
// Although documentation describes a 1 MB limit, the actual limit is 512 KB
// https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
const MAX_RDS_DATA_API_RESPONSE_SIZE = 512000

const serializeError = (error: Error & { code?: number | string }) =>
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
    trxTableNameAsId: string
    eventTypes: Array<string> | null
    inputCursor: ReadModelCursor
    readModelLedger: ReadModelLedger
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
    inlineLedgerExecuteTransaction,
    inlineLedgerExecuteStatement,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
  } = pool

  const transactionId =
    (await inlineLedgerExecuteTransaction(pool, 'begin')) ??
    RDS_TRANSACTION_FAILED_KEY
  const rootSavePointId = generateGuid(transactionId, 'ROOT')

  const saveTrxIdPromise = inlineLedgerExecuteStatement(
    pool,
    `WITH "cte" AS (
      DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
      WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
      RETURNING *
    ) INSERT INTO ${databaseNameAsId}.${trxTableNameAsId}(
      "Timestamp", "XaKey", "XaValue"
    ) VALUES (
      CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
      CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT), 
      ${escapeStr(xaKey)},
      ${escapeStr(transactionId)}
    ) ON CONFLICT ("XaKey") DO UPDATE SET
    "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
    CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
    "XaValue" = ${escapeStr(transactionId)}
    `
  )

  const acquireTrxPromise = inlineLedgerExecuteStatement(
    pool,
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
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
    transactionId,
    true
  )

  basePool.sharedTransactionId = transactionId

  await Promise.all([saveTrxIdPromise, acquireTrxPromise])

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  try {
    const handler = await modelInterop.acquireInitHandler(store)
    if (handler != null) {
      await handler()
    }

    await inlineLedgerExecuteStatement(
      pool,
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "SuccessEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escapeStr(readModelName)}
      `,
      transactionId
    )

    await inlineLedgerExecuteTransaction(pool, 'commit', transactionId)

    await next()
  } catch (error) {
    if (error instanceof PassthroughError) {
      throw error
    }

    await inlineLedgerExecuteStatement(
      pool,
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "Errors" = jsonb_insert(
         COALESCE("Errors", jsonb('[]')),
         CAST(('{' || jsonb_array_length(COALESCE("Errors", jsonb('[]'))) || '}') AS TEXT[]),
         jsonb(${escapeStr(JSON.stringify(serializeError(error)))})
       ),
       "FailedEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escapeStr(readModelName)}
      `,
      transactionId
    )

    await inlineLedgerExecuteTransaction(pool, 'commit', transactionId)
  }
}

export const buildEvents: (
  currentPool: {
    ledgerTableNameAsId: string
    databaseNameAsId: string
    trxTableNameAsId: string
    eventTypes: Array<string> | null
    inputCursor: ReadModelCursor
    readModelLedger: ReadModelLedger
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
    PassthroughError,
    checkEventsContinuity,
    inlineLedgerExecuteTransaction,
    inlineLedgerExecuteStatement,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
    eventTypes,
    inputCursor,
    metricData,
    monitoring,
  } = pool
  const { eventsWithCursors } = buildInfo
  const isContinuousMode =
    typeof eventstoreAdapter.getCursorUntilEventTypes === 'function' &&
    !!process.env.EXPERIMENTAL_SQS_TRANSPORT
  const getContinuousLatestCursor = async (
    cursor: ReadModelCursor,
    events: Array<ReadModelEvent>,
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

  let lastSuccessEvent: ReadModelEvent | null = null
  let lastFailedEvent: ReadModelEvent | null = null
  let lastError: (Error & { code?: string | number }) | null = null
  let localContinue = true
  let cursor: ReadModelCursor = inputCursor

  const groupMonitoring =
    monitoring != null
      ? monitoring
          .group({ Part: 'ReadModelProjection' })
          .group({ ReadModel: readModelName })
      : null

  let eventsApplyStartTimestamp = Date.now()
  let eventCount = 0
  let projectionApplyTime = 0

  const hotEvents: Array<ReadModelEvent> | null =
    isContinuousMode &&
    Array.isArray(eventsWithCursors) &&
    checkEventsContinuity(inputCursor, eventsWithCursors)
      ? eventsWithCursors.map(({ event }) => event)
      : null

  let transactionIdPromise: Promise<string> = inlineLedgerExecuteTransaction(
    pool,
    'begin'
  ).then((result) => (result != null ? result : RDS_TRANSACTION_FAILED_KEY))

  const firstEventsLoadStartTimestamp = Date.now()

  let eventsPromise: Promise<Array<ReadModelEvent>> =
    hotEvents == null
      ? eventstoreAdapter
          .loadEvents({
            eventTypes,
            eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
            limit: 100,
            cursor,
          })
          .then((result) => {
            const loadDuration = Date.now() - firstEventsLoadStartTimestamp
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
      : Promise.resolve(hotEvents)

  let transactionId: string = await transactionIdPromise
  let rootSavePointId: string = generateGuid(transactionId, 'ROOT')

  basePool.sharedTransactionId = transactionId

  let saveTrxIdPromise = inlineLedgerExecuteStatement(
    basePool,
    `WITH "cte" AS (
      DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
      WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
      RETURNING *
    ) INSERT INTO ${databaseNameAsId}.${trxTableNameAsId}(
      "Timestamp", "XaKey", "XaValue"
    ) VALUES (
      CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
      CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT), 
      ${escapeStr(xaKey)},
      ${escapeStr(transactionId)}
    ) ON CONFLICT ("XaKey") DO UPDATE SET
    "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
    CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
    "XaValue" = ${escapeStr(transactionId)}
    `
  )

  let acquireTrxPromise = inlineLedgerExecuteStatement(
    basePool,
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
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
    transactionId,
    true
  )

  let [events] = await Promise.all([
    eventsPromise,
    saveTrxIdPromise,
    acquireTrxPromise,
  ])

  for (metricData.eventLoopCount = 0; true; metricData.eventLoopCount++) {
    if (events.length === 0) {
      throw new PassthroughError(transactionId, false, false)
    }

    transactionIdPromise = inlineLedgerExecuteTransaction(
      pool,
      'begin'
    ).then((result) => (result != null ? result : RDS_TRANSACTION_FAILED_KEY))

    let nextCursorPromise: Promise<ReadModelCursor> = getContinuousLatestCursor(
      cursor,
      events,
      eventTypes
    )
    const eventsLoadStartTimestamp = Date.now()
    eventsPromise = Promise.resolve(nextCursorPromise)
      .then((nextCursor) =>
        eventstoreAdapter.loadEvents({
          eventTypes,
          eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
          limit: 1000,
          cursor: nextCursor,
        })
      )
      .then((result) => {
        const loadDuration = Date.now() - eventsLoadStartTimestamp

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

    let appliedEventsCount = 0
    try {
      for (const event of events) {
        const savePointId = generateGuid(transactionId, `${appliedEventsCount}`)
        try {
          const handler = await modelInterop.acquireEventHandler(store, event)
          if (handler != null) {
            await inlineLedgerExecuteStatement(
              pool,
              `SAVEPOINT ${savePointId}`,
              transactionId
            )
            const projectionApplyStartTimestamp = Date.now()
            try {
              metricData.insideProjection = true
              await handler()
              eventCount++
            } finally {
              metricData.insideProjection = false
            }
            projectionApplyTime += Date.now() - projectionApplyStartTimestamp

            await inlineLedgerExecuteStatement(
              pool,
              `RELEASE SAVEPOINT ${savePointId}`,
              transactionId
            )
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

          await inlineLedgerExecuteStatement(
            pool,
            `ROLLBACK TO SAVEPOINT ${savePointId};
             RELEASE SAVEPOINT ${savePointId}
          `,
            transactionId
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
      await inlineLedgerExecuteStatement(
        pool,
        `ROLLBACK TO SAVEPOINT ${rootSavePointId};
         RELEASE SAVEPOINT ${rootSavePointId}
      `,
        transactionId
      )
    }

    const nextCursor = await nextCursorPromise
    if (lastError == null) {
      await inlineLedgerExecuteStatement(
        pool,
        `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId} SET 
         ${
           lastSuccessEvent != null
             ? `"SuccessEvent" = ${escapeStr(
                 JSON.stringify(lastSuccessEvent)
               )},`
             : ''
         } 
         "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        `,
        transactionId
      )
    } else {
      await inlineLedgerExecuteStatement(
        pool,
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
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        `,
        transactionId
      )
    }

    await inlineLedgerExecuteTransaction(pool, 'commit', transactionId)

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
      transactionId = await transactionIdPromise
      rootSavePointId = generateGuid(transactionId, 'ROOT')

      basePool.sharedTransactionId = transactionId

      saveTrxIdPromise = inlineLedgerExecuteStatement(
        pool,
        `WITH "cte" AS (
          DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
          WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
          RETURNING *
        ) INSERT INTO ${databaseNameAsId}.${trxTableNameAsId}(
          "Timestamp", "XaKey", "XaValue"
        ) VALUES (
          CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
          CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT), 
          ${escapeStr(xaKey)},
          ${escapeStr(transactionId)}
        ) ON CONFLICT ("XaKey") DO UPDATE SET
        "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
        CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
        "XaValue" = ${escapeStr(transactionId)}
        `
      )

      acquireTrxPromise = inlineLedgerExecuteStatement(
        pool,
        `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
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
        transactionId,
        true
      )

      void ([events] = await Promise.all([
        eventsPromise,
        saveTrxIdPromise,
        acquireTrxPromise,
      ]))
    } else {
      if (isBuildSuccess) {
        await next()
      }

      throw new PassthroughError(await transactionIdPromise, false, false)
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
  eventstoreAdapter.establishTimeLimit(getVacantTimeInMillis)
  const { eventsWithCursors, ...inputMetricData } = buildInfo
  const metricData = {
    ...inputMetricData,
    pureLedgerTime: 0,
    insideProjection: false,
  }
  void eventsWithCursors

  const {
    PassthroughError,
    inlineLedgerExecuteTransaction,
    generateGuid,
    schemaName,
    escapeId,
    escapeStr,
    inlineLedgerExecuteStatement: ledgerStatement,
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

  const inlineLedgerExecuteStatement: typeof ledgerStatement = Object.assign(
    async (...args: any[]): Promise<any> => {
      const inlineLedgerStartTimestamp = Date.now()
      try {
        return await (ledgerStatement as any)(...args)
      } finally {
        if (!metricData.insideProjection) {
          metricData.pureLedgerTime += Date.now() - inlineLedgerStartTimestamp
        }
      }
    },
    ledgerStatement
  )

  try {
    basePool.activePassthrough = true
    const databaseNameAsId = escapeId(schemaName)
    const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
    const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    const rows = (await inlineLedgerExecuteStatement(
      basePool,
      `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         AND "IsPaused" = FALSE
         AND "Errors" IS NULL
         FOR NO KEY UPDATE NOWAIT
       )
       UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "XaKey" = ${escapeStr(xaKey)}
       WHERE "EventSubscriber" = ${escapeStr(readModelName)}
       AND (SELECT Count("CTE".*) FROM "CTE") = 1
       AND "IsPaused" = FALSE
       AND "Errors" IS NULL
       RETURNING ${databaseNameAsId}.${ledgerTableNameAsId}.*
      `
    )) as Array<{
      EventTypes: string | null
      AggregateIds: string | null
      Cursor: string | null
      SuccessEvent: string | null
      FailedEvent: string | null
      Errors: string | null
      Schema: string | null
    }>

    const readModelLedger =
      rows.length === 1
        ? ({
            EventTypes:
              rows[0].EventTypes != null
                ? JSON.parse(rows[0].EventTypes)
                : null,
            AggregateIds:
              rows[0].AggregateIds != null
                ? JSON.parse(rows[0].AggregateIds)
                : null,
            Cursor: rows[0].Cursor != null ? JSON.parse(rows[0].Cursor) : null,
            SuccessEvent:
              rows[0].SuccessEvent != null
                ? JSON.parse(rows[0].SuccessEvent)
                : null,
            FailedEvent:
              rows[0].FailedEvent != null
                ? JSON.parse(rows[0].FailedEvent)
                : null,
            Errors: rows[0].Errors != null ? JSON.parse(rows[0].Errors) : null,
            Schema: rows[0].Schema != null ? JSON.parse(rows[0].Schema) : null,
          } as ReadModelLedger)
        : null

    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError(null, false, false)
    }

    const { EventTypes: eventTypes, Cursor: cursor } = readModelLedger

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    const currentPool = {
      databaseNameAsId,
      ledgerTableNameAsId,
      trxTableNameAsId,
      inputCursor: cursor,
      readModelLedger,
      eventTypes,
      xaKey,
      metricData,
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
    if (
      error == null ||
      !(
        error instanceof PassthroughError ||
        error.name === 'RequestTimeoutError' ||
        error.name === 'ServiceBusyError'
      )
    ) {
      throw error
    }
    const passthroughError = error as PassthroughErrorInstance

    if (passthroughError.lastTransactionId != null) {
      try {
        await inlineLedgerExecuteTransaction(
          basePool,
          'rollback',
          passthroughError.lastTransactionId
        )
      } catch (err) {
        if (!(err instanceof PassthroughError && err.isEmptyTransaction)) {
          throw err
        }
      }
    }

    if (
      passthroughError.isRetryable ||
      error.name === 'RequestTimeoutError' ||
      error.name === 'ServiceBusyError'
    ) {
      await next()
    }
  } finally {
    basePool.activePassthrough = false

    for (const innerMonitoring of [monitoring, groupMonitoring]) {
      if (innerMonitoring != null) {
        if (hasSendTime) {
          innerMonitoring.timeEnd('EventApply')
        }

        innerMonitoring.duration('Ledger', metricData.pureLedgerTime)
      }
    }
  }
}

export default build
