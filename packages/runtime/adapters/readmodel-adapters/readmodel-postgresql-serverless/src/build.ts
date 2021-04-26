/* eslint-disable spellcheck/spell-checker */

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
    nt: any
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
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
    nt,
  } = pool

  nt.buildKind = 'init'

  const {
    transactionId = RDS_TRANSACTION_FAILED_KEY,
  } = await rdsDataService.beginTransaction({
    resourceArn: dbClusterOrInstanceArn,
    secretArn: awsSecretStoreArn,
    database: 'postgres',
  })
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

    await rdsDataService.commitTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      transactionId,
    })

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

    await rdsDataService.commitTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      transactionId,
    })
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
    nt: any
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
  getVacantTimeInMillis
) => {
  const pool = { ...basePool, ...currentPool }
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
    escapeStr,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
    eventTypes,
    inputCursor,
    nt,
  } = pool

  nt.buildKind = 'events'

  let lastSuccessEvent: ReadModelEvent | null = null
  let lastFailedEvent: ReadModelEvent | null = null
  let lastError: (Error & { code?: string | number }) | null = null
  let localContinue = true
  let cursor: ReadModelCursor = inputCursor

  let transactionIdPromise: Promise<string> = rdsDataService
    .beginTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
    })
    .then((result) =>
      result != null && result.transactionId != null
        ? result.transactionId
        : RDS_TRANSACTION_FAILED_KEY
    )

  const tsEp = Date.now()

  let eventsPromise: Promise<Array<ReadModelEvent>> = eventstoreAdapter
    .loadEvents({
      eventTypes,
      eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
      limit: 100,
      cursor,
    })
    .then((result) => {
      nt.pureEventLoadTime += Date.now() - tsEp
      return result != null ? result.events : []
    })

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

  for (nt.eventLoopCount = 0; true; nt.eventLoopCount++) {
    if (events.length === 0) {
      nt.discardReason = 'zero-events'
      throw new PassthroughError(transactionId)
    }

    transactionIdPromise = rdsDataService
      .beginTransaction({
        resourceArn: dbClusterOrInstanceArn,
        secretArn: awsSecretStoreArn,
        database: 'postgres',
      })
      .then((result) =>
        result != null && result.transactionId != null
          ? result.transactionId
          : RDS_TRANSACTION_FAILED_KEY
      )

    let nextCursor: ReadModelCursor = eventstoreAdapter.getNextCursor(
      cursor,
      events
    )
    const tsEp = Date.now()
    eventsPromise = eventstoreAdapter
      .loadEvents({
        eventTypes,
        eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
        limit: 1000,
        cursor: nextCursor,
      })
      .then((result) => {
        nt.pureEventLoadTime += Date.now() - tsEp
        return result != null ? result.events : []
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
            const tsAh = Date.now()
            try {
              nt.insideProjection = true
              await handler()
            } finally {
              nt.insideProjection = false
            }
            nt.pureProjectionApplyTime += Date.now() - tsAh

            await inlineLedgerExecuteStatement(
              pool,
              `RELEASE SAVEPOINT ${savePointId}`,
              transactionId
            )
            lastSuccessEvent = event
          }
          appliedEventsCount++

          if (getVacantTimeInMillis() < 0) {
            nextCursor = eventstoreAdapter.getNextCursor(
              cursor,
              events.slice(0, appliedEventsCount)
            )
            localContinue = false
            break
          }
        } catch (error) {
          if (error instanceof PassthroughError) {
            throw error
          }

          nextCursor = eventstoreAdapter.getNextCursor(
            cursor,
            events.slice(0, appliedEventsCount)
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

      nextCursor = cursor
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

    await rdsDataService.commitTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      transactionId,
    })

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
        nt.discardReason = 'invoke-next-round'
        await next()
      } else {
        nt.discardReason = 'error-in-read-model'
      }

      throw new PassthroughError(await transactionIdPromise)
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
  ...args
) => {
  const nt: any = {
    ...(args as any)[0],
    receiveTime: Date.now(),
    name: 'NTPROFILE',
    pureEventLoadTime: 0,
    pureProjectionApplyTime: 0,
    pureLedgerTime: 0,
  }

  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escapeStr,
    rdsDataService,
    inlineLedgerExecuteStatement: iles,
    generateGuid,
    monitoring,
  } = basePool

  const now = Date.now()

  const hasSendTime = typeof nt.sendTime === 'number'

  const groupMonitoring =
    monitoring != null
      ? monitoring
          .group({ Part: 'ReadModelProjection' })
          .group({ ReadModel: readModelName })
      : null

  if (monitoring != null && groupMonitoring != null && hasSendTime) {
    monitoring.time('NotificationToBuildStart', nt.sendTime)
    monitoring.timeEnd('NotificationToBuildStart', now)

    groupMonitoring.time('NotificationToBuildStart', nt.sendTime)
    groupMonitoring.timeEnd('NotificationToBuildStart', now)

    monitoring.time('NotificationToBuildEnd', now)
    groupMonitoring.time('NotificationToBuildStart', nt.sendTime)
  }

  const inlineLedgerExecuteStatement: typeof iles = Object.assign(
    async (...args: any[]): Promise<any> => {
      const ilTs = Date.now()
      try {
        return await (iles as any)(...args)
      } finally {
        if (!nt.insideProjection) {
          nt.pureLedgerTime += Date.now() - ilTs
        }
      }
    },
    iles
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
    nt.fetchLedgerTime = Date.now()

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
      nt.discardReason = 'busy-initial-ledger'
      throw new PassthroughError(null)
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
      nt,
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
      getVacantTimeInMillis
    )
  } catch (error) {
    if (nt.discardReason == null) {
      nt.discardReason = 'error'
      nt.error = error
    }

    if (!(error instanceof PassthroughError)) {
      throw error
    }
    const passthroughError = error as PassthroughErrorInstance

    if (passthroughError.lastTransactionId != null) {
      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId: passthroughError.lastTransactionId,
        })
      } catch (err) {
        if (
          !(
            err != null &&
            (/Transaction .*? Is Not Found/i.test(err.message) ||
              /Transaction .*? Is Not Found/i.test(err.stack) ||
              /Transaction is expired/i.test(err.message) ||
              /Transaction is expired/i.test(err.stack) ||
              /Invalid transaction ID/i.test(err.message) ||
              /Invalid transaction ID/i.test(err.stack))
          )
        ) {
          throw err
        }
      }
    }
  } finally {
    basePool.activePassthrough = false

    if (monitoring != null && groupMonitoring != null) {
      if (hasSendTime) {
        monitoring.timeEnd('NotificationToBuildEnd')
        groupMonitoring.timeEnd('NotificationToBuildEnd')
      }

      monitoring.time('EventLoadTime', 0)
      monitoring.timeEnd('EventLoadTime', nt.pureEventLoadTime)

      groupMonitoring.time('EventLoadTime', 0)
      groupMonitoring.timeEnd('EventLoadTime', nt.pureEventLoadTime)

      monitoring.time('ProjectionApplyTime', 0)
      monitoring.timeEnd('ProjectionApplyTime', nt.pureProjectionApplyTime)

      groupMonitoring.time('ProjectionApplyTime', 0)
      groupMonitoring.timeEnd('ProjectionApplyTime', nt.pureProjectionApplyTime)

      monitoring.time('LedgerTime', 0)
      monitoring.timeEnd('LedgerTime', nt.pureLedgerTime)

      groupMonitoring.time('LedgerTime', 0)
      groupMonitoring.timeEnd('LedgerTime', nt.pureLedgerTime)
    }
  }
}

export default build
