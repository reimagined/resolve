import type {
  PassthroughErrorInstance,
  ExternalMethods,
  ReadModelCursor,
  ReadModelProcedureLedger,
  ProcedureResult,
  EventThreadData,
  ReadModelEvent,
} from './types'
import getLog from './get-log'
import { LeveledDebugger } from '@resolve-js/debug-levels'

const serializeError = (error: Error & { code: number }) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const immediatelyStopError = new Error('ImmediatelyStopError')
const immediatelyStopTimeout = 45 * 1000

const buildInit: (
  currentPool: {
    ledgerTableNameAsId: string
    databaseNameAsId: string
    eventTypes: Array<string> | null
    inputCursor: ReadModelCursor
    readModelLedger: ReadModelProcedureLedger
    xaKey: string
    log: LeveledDebugger
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
    log,
  } = pool

  const rootSavePointId = generateGuid(xaKey, 'ROOT')

  log.debug(`Begin init transaction`)

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

  log.debug(`Building of cursor`)

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])

  try {
    const handler = await modelInterop.acquireInitHandler(store)
    if (handler != null) {
      log.debug(`Running of init handler`)
      await handler()
    }
    // TODO Init via plv8

    log.debug(`Commit transaction with SuccessEvent`)

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

    log.debug(`Init handler execution failed. Commit transaction with error`)

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
    log: LeveledDebugger
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
    buildMode,
    metricData,
    monitoring,
    inputCursor,
    eventTypes,
    escapeId,
    xaKey,
    log,
  } = pool
  const { eventsWithCursors } = buildInfo
  let isProcedural = inputIsProcedural
  if (buildMode === 'nodejs') {
    isProcedural = false
  }

  const isContinuousMode =
    typeof eventstoreAdapter.getCursorUntilEventTypes === 'function' &&
    !!process.env.EXPERIMENTAL_SQS_TRANSPORT
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

  type LoadEventsResult = ['ok', ReadModelEvent[]] | ['error', Error]
  const loadEventsWithMonitoring = async (
    cursorPromise: Promise<ReadModelCursor>,
    limit: number,
    initialTimestamp: number
  ): Promise<LoadEventsResult> => {
    try {
      const cursor = await cursorPromise
      const { events } = await eventstoreAdapter.loadEvents({
        eventTypes,
        eventsSizeLimit: 65536 * limit,
        limit,
        cursor,
      })
      const loadDuration = Date.now() - initialTimestamp

      if (groupMonitoring != null && events.length > 0) {
        groupMonitoring.duration(
          'EventLoad',
          loadDuration / events.length,
          events.length
        )
      }

      return ['ok', events]
    } catch (error) {
      return ['error', error]
    }
  }

  let eventsPromise: Promise<LoadEventsResult | null> =
    hotEvents == null
      ? loadEventsWithMonitoring(
          Promise.resolve(cursor),
          100,
          firstEventsLoadStartTimestamp
        )
      : Promise.resolve(['ok', hotEvents])

  const eventstoreLocalResourcePromise = (async () => {
    let resourceNames = null
    try {
      void ({ resourceNames } =
        hotEvents == null && !!process.env.EXPERIMENTAL_INLINE_DB_EVENT_LOAD
          ? await eventstoreAdapter.describe()
          : { resourceNames: null })
    } catch (err) {}

    if (
      resourceNames == null ||
      resourceNames?.eventsTableName == null ||
      resourceNames?.databaseName == null ||
      !isProcedural
    ) {
      return null
    }

    const databaseNameAsId = escapeId(resourceNames.databaseName)
    const eventsTableNameAsId = escapeId(resourceNames.eventsTableName)

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentPromiseResult = (await eventsPromise)!
      if (currentPromiseResult[0] === 'error') {
        throw currentPromiseResult[1]
      }

      const immediateLastEvent = currentPromiseResult[1].slice(-1)[0]
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
          SELECT 1/Count("CTE".*) AS "NonZero" FROM "CTE"
        `)

      return resourceNames
    } catch (err) {
      return null
    }
  })()

  let rootSavePointId = generateGuid(xaKey, 'ROOT')

  log.debug(`Begin events apply transaction`)

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

  const eventstoreLocalResourcesNames = await eventstoreLocalResourcePromise
  const currentEventsResult = await eventsPromise
  if (currentEventsResult != null && currentEventsResult[0] === 'error') {
    throw currentEventsResult[1]
  }

  let events =
    eventstoreLocalResourcesNames == null && currentEventsResult != null
      ? currentEventsResult[1]
      : null
  let isLastEmptyLoop = false

  for (metricData.eventLoopCount = 0; true; metricData.eventLoopCount++) {
    const isEffectiveEventLoop = events == null || events.length > 0
    log.debug(`Start optimistic events loading`)

    let nextCursorPromise: Promise<ReadModelCursor> | null =
      events != null
        ? getContinuousLatestCursor(cursor, events, eventTypes)
        : null
    let appliedEventsCount = 0
    let regularWorkflow = true

    if (isProcedural && isEffectiveEventLoop) {
      log.debug(`Running procedural events applying`)
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
                ...(eventstoreLocalResourcesNames != null
                  ? {
                      localEventsDatabaseName:
                        eventstoreLocalResourcesNames.databaseName,
                      localEventsTableName:
                        eventstoreLocalResourcesNames.eventsTableName,
                    }
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
          if (nextCursorPromise == null) {
            nextCursorPromise = getContinuousLatestCursor(
              cursor,
              appliedEventsThreadData,
              eventTypes
            )
          }

          lastSuccessEvent = successEvent
        } else if (status === 'CUSTOM_ERROR') {
          lastFailedEvent = failureEvent
          lastError = failureError

          if (
            failureError != null &&
            failureEvent != null &&
            groupMonitoring != null
          ) {
            groupMonitoring
              .group({ EventType: failureEvent.type })
              .error(failureError)
          }
        }

        if (getVacantTimeInMillis() < 0) {
          localContinue = false
        }

        regularWorkflow = false
      } catch (err) {
        isProcedural = false
        if (err instanceof PassthroughError) {
          throw err
        }

        // eslint-disable-next-line no-console
        console.warn(
          `Inline procedure execution failed for reason: ${JSON.stringify(
            serializeError(err)
          )}`
        )

        await inlineLedgerRunQuery(`ROLLBACK TO SAVEPOINT ${rootSavePointId};`)

        if (events == null) {
          const currentEventResult = await loadEventsWithMonitoring(
            Promise.resolve(cursor),
            100,
            Date.now()
          )
          if (currentEventResult[0] === 'ok') {
            events = currentEventResult[1]
          } else {
            throw currentEventResult[1]
          }
        }

        nextCursorPromise = getContinuousLatestCursor(
          cursor,
          events,
          eventTypes
        )
      }
      log.debug(`Finish running procedural events applying`)
    }

    const eventsLoadStartTimestamp = Date.now()
    const getEventsPromise = (regularWorkflow ||
    eventstoreLocalResourcesNames == null
      ? loadEventsWithMonitoring.bind(
          null,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nextCursorPromise!,
          1000,
          eventsLoadStartTimestamp
        )
      : Promise.resolve.bind(null, null)) as () => Promise<
      ['ok', ReadModelEvent[]] | ['error', Error]
    >

    eventsPromise = getEventsPromise()
    if (regularWorkflow && buildMode === 'plv8') {
      throw new Error(
        `Event subscriber ${readModelName} forced to be built only in PLV8 mode, but cannot do it`
      )
    }

    if (regularWorkflow && isEffectiveEventLoop) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      events = events!
      log.debug(`Running regular workflow events applying`)
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
          log.debug(`Running failed with PassthroughError`)
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
      log.debug(`Finish running regular workflow events applying`)
    }
    const nextCursor = await nextCursorPromise

    if (lastError == null && isEffectiveEventLoop) {
      log.debug(`Saving success event into inline ledger`)
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
    } else if (isEffectiveEventLoop) {
      log.debug(`Saving error and failed event into inline ledger`)
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

    log.debug(`Inline ledger updated after events applied`)

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

    const isBuildSuccess: boolean =
      lastError == null && (appliedEventsCount > 0 || !isLastEmptyLoop)
    isLastEmptyLoop = isBuildSuccess && appliedEventsCount === 0
    cursor = nextCursor

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      log.debug(`Start transaction for the next step events applying`)
      rootSavePointId = generateGuid(xaKey, 'ROOT')

      const runNextDatabaseLoop = inlineLedgerRunQuery.bind(
        null,
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

      if (!isLastEmptyLoop) {
        await runNextDatabaseLoop()
        const currentEventsResult = await eventsPromise
        if (currentEventsResult != null && currentEventsResult[0] === 'error') {
          throw currentEventsResult[1]
        }
        events = currentEventsResult != null ? currentEventsResult[1] : null
      } else {
        eventsPromise = getEventsPromise()
        const currentEventsResult = await eventsPromise
        if (currentEventsResult != null && currentEventsResult[0] === 'error') {
          throw currentEventsResult[1]
        }
        events = currentEventsResult != null ? currentEventsResult[1] : null
        await runNextDatabaseLoop()
      }
    } else {
      if (isBuildSuccess) {
        log.debug(`Going to the next step of building`)
        await next()
      }

      log.debug(`Exit from events building`)
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
  inputGetVacantTimeInMillis,
  buildInfo
) => {
  const log = getLog('build')
  log.debug(`Start building`)
  const getVacantTimeInMillis = () =>
    Math.max(inputGetVacantTimeInMillis() - immediatelyStopTimeout, 0)
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

    log.debug(`Running inline ledger query`)

    const rows = (await inlineLedgerRunQuery(
      `WITH "MaybeAcquireLock" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         AND "IsPaused" = FALSE
         AND "Errors" IS NULL
         FOR NO KEY UPDATE NOWAIT
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
      log.debug(`Ledger is not locked. Throwing PassthroughError`)
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
      log,
    }

    let buildMethod: typeof buildEvents

    if (cursor == null) {
      log.debug(`Ledger is locked. Running build init`)
      buildMethod = buildInit
    } else {
      log.debug(`Ledger is locked. Running build events`)
      buildMethod = buildEvents
    }

    let barrierTimeout: ReturnType<typeof setTimeout> | null = null

    try {
      await Promise.race([
        new Promise((_, reject) => {
          barrierTimeout = setTimeout(() => {
            reject(immediatelyStopError)
            barrierTimeout = null
          }, inputGetVacantTimeInMillis())
        }),
        buildMethod(
          currentPool,
          basePool,
          readModelName,
          store,
          modelInterop,
          next,
          eventstoreAdapter,
          getVacantTimeInMillis,
          buildInfo
        ),
      ])
    } finally {
      if (barrierTimeout != null) {
        clearTimeout(barrierTimeout)
        barrierTimeout = null
      }
    }

    try {
      await inlineLedgerRunQuery(`
        DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
        WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000  
      `)
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        log.debug(`Unknown error is thrown while cleaning TRX journal`)
        throw err
      }
    }
  } catch (error) {
    if (error === immediatelyStopError) {
      try {
        await basePool.connection.end()
      } catch (e) {}
      await next()
      return
    }

    if (
      error == null ||
      !(
        error instanceof PassthroughError ||
        error.name === 'AlreadyDisposedError' ||
        error.name === 'RequestTimeoutError' ||
        error.name === 'ServiceBusyError'
      )
    ) {
      log.debug(`Unknown error is thrown while building`)
      throw error
    }

    log.debug(`PassthroughError is thrown while building`)
    const passthroughError = error as PassthroughErrorInstance

    try {
      log.debug(`Running rollback after error`)
      await inlineLedgerRunQuery(`ROLLBACK`)
      log.debug(`Transaction is rolled back`)
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        log.debug(`Unknown error is thrown while rollback`)
        throw err
      }
      log.debug(`PassthroughError is thrown while rollback`)
    }

    if (
      passthroughError.isRetryable ||
      error.name === 'AlreadyDisposedError' ||
      error.name === 'RequestTimeoutError' ||
      error.name === 'ServiceBusyError'
    ) {
      log.debug(`PassthroughError is retryable. Going to the next step`)
      await next()
    }
  } finally {
    log.debug(`Building is finished`)
    basePool.activePassthrough = false

    for (const innerMonitoring of [monitoring, groupMonitoring]) {
      if (innerMonitoring != null) {
        innerMonitoring.duration('Ledger', metricData.pureLedgerTime)
      }
    }
  }
}

export default build
