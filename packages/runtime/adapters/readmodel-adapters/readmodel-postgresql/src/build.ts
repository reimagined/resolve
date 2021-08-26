import { ReadModelEvent } from '../../readmodel-base/types'
import type {
  PassthroughErrorInstance,
  ExternalMethods,
  ReadModelCursor,
  ReadModelProcedureLedger,
  ProcedureResult,
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
    eventStoreOperationTimeLimited,
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
    log,
  } = pool
  const { eventsWithCursors } = buildInfo
  let isProcedural = inputIsProcedural
  const isContinuousMode =
    typeof eventstoreAdapter.getCursorUntilEventTypes === 'function'
  const getContinuousLatestCursor = async (
    cursor: ReadModelCursor,
    events: Array<ReadModelEvent>,
    eventTypes: Array<string> | null
  ) => {
    let nextCursor = await eventstoreAdapter.getNextCursor(cursor, events)
    if (isContinuousMode && eventTypes != null) {
      nextCursor = await eventStoreOperationTimeLimited(
        eventstoreAdapter as Required<typeof eventstoreAdapter>,
        Object.bind(null, new PassthroughError(true)),
        getVacantTimeInMillis,
        'getCursorUntilEventTypes',
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

  if (hotEvents == null) {
    log.debug(`Start loading events`)
  } else {
    log.debug(`Getting of hot events`)
  }

  let eventsPromise =
    hotEvents == null
      ? eventStoreOperationTimeLimited(
          eventstoreAdapter,
          Object.bind(null, new PassthroughError(true)),
          getVacantTimeInMillis,
          'loadEvents',
          {
            eventTypes,
            eventsSizeLimit: 6553600,
            limit: 100,
            cursor,
          }
        ).then((result) => {
          log.debug(`Events loaded`)
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

  let events = await eventsPromise

  for (metricData.eventLoopCount = 0; true; metricData.eventLoopCount++) {
    if (events.length === 0) {
      throw new PassthroughError(false)
    }

    log.debug(`Start optimistic events loading`)

    let nextCursorPromise: Promise<ReadModelCursor> = getContinuousLatestCursor(
      cursor,
      events,
      eventTypes
    )

    const eventsLoadStartTimestamp = Date.now()
    eventsPromise = Promise.resolve(nextCursorPromise)
      .then((nextCursor) =>
        eventStoreOperationTimeLimited(
          eventstoreAdapter,
          Object.bind(null, new PassthroughError(true)),
          getVacantTimeInMillis,
          'loadEvents',
          {
            eventTypes,
            eventsSizeLimit: 65536000,
            limit: 1000,
            cursor: nextCursor,
          }
        )
      )
      .then((result) => {
        log.debug(`Events loaded optimistically`)
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
    let regularWorkflow = true

    if (isProcedural) {
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
                events,
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
            events.slice(0, appliedCount),
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
      } catch (err) {
        isProcedural = false

        // eslint-disable-next-line no-console
        console.warn(
          `Inline procedure execution failed for reason: ${JSON.stringify(
            serializeError(err)
          )}`
        )

        await inlineLedgerRunQuery(`ROLLBACK TO SAVEPOINT ${rootSavePointId};`)
      }
      log.debug(`Finish running procedural events applying`)
    }

    if (regularWorkflow) {
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
    if (lastError == null) {
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
    } else {
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

    const isBuildSuccess = lastError == null && appliedEventsCount > 0
    cursor = nextCursor

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      log.debug(`Start transaction for the next step events applying`)
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
  getVacantTimeInMillis,
  buildInfo
) => {
  const log = getLog('build')
  log.debug(`Start building`)

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

    if (passthroughError.isRetryable) {
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
