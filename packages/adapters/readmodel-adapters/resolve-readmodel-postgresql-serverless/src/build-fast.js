const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const RESERVED_TIME = 30 * 1000

const buildFastInit = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
    eventstoreAdapter,
    escape,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
  } = pool

  const { transactionId } = await rdsDataService.beginTransaction({
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
      ${escape(xaKey)},
      ${escape(transactionId)}
    ) ON CONFLICT ("XaKey") DO UPDATE SET
    "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
    CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
    "XaValue" = ${escape(transactionId)}
    `
  )

  const acquireTrxPromise = inlineLedgerExecuteStatement(
    pool,
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     SAVEPOINT ${rootSavePointId};
     SELECT 1/(
      SELECT Count("XaKey") FROM ${databaseNameAsId}.${ledgerTableNameAsId}
      WHERE "EventSubscriber" = ${escape(readModelName)}
      AND "XaKey" = ${escape(xaKey)}
      AND "IsPaused" = FALSE
      AND "Errors" IS NULL
      FOR NO KEY UPDATE NOWAIT
    ) AS "NonZero";
    `,
    transactionId,
    true
  )

  await Promise.all([saveTrxIdPromise, acquireTrxPromise])

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  try {
    if (typeof projection.Init === 'function') {
      await projection.Init(store)
    }

    await inlineLedgerExecuteStatement(
      pool,
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "SuccessEvent" = ${escape(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escape(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escape(readModelName)}
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
         jsonb(${escape(JSON.stringify(serializeError(error)))})
       ),
       "FailedEvent" = ${escape(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escape(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escape(readModelName)}
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

const buildFastEvents = async (
  pool,
  readModelName,
  store,
  projection,
  next
) => {
  const {
    PassthroughError,
    getRemainingTimeInMillis,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
    eventstoreAdapter,
    escape,
    databaseNameAsId,
    ledgerTableNameAsId,
    trxTableNameAsId,
    xaKey,
    eventTypes,
    cursor: inputCursor,
  } = pool

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError = null
  let localContinue = true
  let cursor = inputCursor

  let transactionIdPromise = rdsDataService
    .beginTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
    })
    .then((result) => (result != null ? result.transactionId : null))

  let eventsPromise = eventstoreAdapter
    .loadEvents({
      eventTypes,
      eventsSizeLimit: 6553600,
      limit: 100,
      cursor,
    })
    .then((result) => (result != null ? result.events : null))

  let transactionId = await transactionIdPromise
  let rootSavePointId = generateGuid(transactionId, 'ROOT')

  Object.getPrototypeOf(pool).transactionId = transactionId

  let saveTrxIdPromise = inlineLedgerExecuteStatement(
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
      ${escape(xaKey)},
      ${escape(transactionId)}
    ) ON CONFLICT ("XaKey") DO UPDATE SET
    "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
    CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
    "XaValue" = ${escape(transactionId)}
    `
  )

  let acquireTrxPromise = inlineLedgerExecuteStatement(
    pool,
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     SAVEPOINT ${rootSavePointId};
     SELECT 1/(
       SELECT Count("XaKey") FROM ${databaseNameAsId}.${ledgerTableNameAsId}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND "XaKey" = ${escape(xaKey)}
       AND "IsPaused" = FALSE
       AND "Errors" IS NULL
       FOR NO KEY UPDATE NOWAIT
     ) AS "NonZero";
    `,
    transactionId,
    true
  )

  let [events] = await Promise.all([
    eventsPromise,
    saveTrxIdPromise,
    acquireTrxPromise,
  ])

  while (true) {
    if (events.length === 0) {
      throw new PassthroughError(transactionId)
    }

    transactionIdPromise = rdsDataService
      .beginTransaction({
        resourceArn: dbClusterOrInstanceArn,
        secretArn: awsSecretStoreArn,
        database: 'postgres',
      })
      .then((result) => (result != null ? result.transactionId : null))

    let nextCursor = eventstoreAdapter.getNextCursor(cursor, events)

    eventsPromise = eventstoreAdapter
      .loadEvents({
        eventTypes,
        eventsSizeLimit: 6553600,
        limit: 100,
        cursor: nextCursor,
      })
      .then((result) => (result != null ? result.events : null))

    let appliedEventsCount = 0
    try {
      for (const event of events) {
        const savePointId = generateGuid(transactionId, `${appliedEventsCount}`)
        try {
          if (typeof projection[event.type] === 'function') {
            await inlineLedgerExecuteStatement(
              pool,
              `SAVEPOINT ${savePointId}`,
              transactionId
            )
            await projection[event.type](store, event)
            await inlineLedgerExecuteStatement(
              pool,
              `RELEASE SAVEPOINT ${savePointId}`,
              transactionId
            )
            lastSuccessEvent = event
          }
          appliedEventsCount++

          if (getRemainingTimeInMillis() < RESERVED_TIME) {
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
             ? `"SuccessEvent" = ${escape(JSON.stringify(lastSuccessEvent))},`
             : ''
         } 
         "Cursor" = ${escape(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escape(readModelName)}
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
           jsonb(${escape(JSON.stringify(serializeError(lastError)))})
         ),
         ${
           lastFailedEvent != null
             ? `"FailedEvent" = ${escape(JSON.stringify(lastFailedEvent))},`
             : ''
         }
         ${
           lastSuccessEvent != null
             ? `"FailedEvent" = ${escape(JSON.stringify(lastSuccessEvent))},`
             : ''
         }
         "Cursor" = ${escape(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escape(readModelName)}
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

    if (getRemainingTimeInMillis() < RESERVED_TIME) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      transactionId = await transactionIdPromise
      rootSavePointId = generateGuid(transactionId, 'ROOT')

      Object.getPrototypeOf(pool).transactionId = transactionId

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
          ${escape(xaKey)},
          ${escape(transactionId)}
        ) ON CONFLICT ("XaKey") DO UPDATE SET
        "Timestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) + 
        CAST(COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) AS BIGINT),
        "XaValue" = ${escape(transactionId)}
        `
      )

      acquireTrxPromise = inlineLedgerExecuteStatement(
        pool,
        `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
        SAVEPOINT ${rootSavePointId};
        SELECT 1/(
          SELECT Count("XaKey") FROM ${databaseNameAsId}.${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}
          AND "XaKey" = ${escape(xaKey)}
          AND "IsPaused" = FALSE
          AND "Errors" IS NULL
          FOR NO KEY UPDATE NOWAIT
        ) AS "NonZero";
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

      throw new PassthroughError(await transactionIdPromise)
    }
  }
}

const buildFast = async (
  basePool,
  readModelName,
  store,
  projection,
  next,
  getRemainingTimeInMillis
) => {
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
  } = basePool
  const pool = Object.create(basePool)

  try {
    const databaseNameAsId = escapeId(schemaName)
    const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
    const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    const rows = await inlineLedgerExecuteStatement(
      pool,
      `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         AND "IsPaused" = FALSE
         AND "Errors" IS NULL
         FOR NO KEY UPDATE NOWAIT
       )
       UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "XaKey" = ${escape(xaKey)}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND (SELECT Count("CTE".*) FROM "CTE") = 1
       AND "IsPaused" = FALSE
       AND "Errors" IS NULL
       RETURNING ${databaseNameAsId}.${ledgerTableNameAsId}.*
      `
    )

    let readModelLedger = rows.length === 1 ? rows[0] : null
    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError(null)
    }

    const eventTypes =
      readModelLedger.EventTypes != null
        ? JSON.parse(readModelLedger.EventTypes)
        : null

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    const cursor =
      readModelLedger.Cursor != null ? JSON.parse(readModelLedger.Cursor) : null

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    Object.assign(pool, {
      getRemainingTimeInMillis,
      databaseNameAsId,
      ledgerTableNameAsId,
      trxTableNameAsId,
      xaKey,
      readModelLedger,
      eventTypes,
      cursor,
    })

    const buildMethod = cursor == null ? buildFastInit : buildFastEvents
    await buildMethod(pool, readModelName, store, projection, next)
  } catch (error) {
    if (!(error instanceof PassthroughError)) {
      throw error
    }

    if (error.lastTransactionId != null) {
      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId: error.lastTransactionId,
        })
      } catch (err) {
        if (
          !(
            err != null &&
            (/Transaction .*? Is Not Found/i.test(err.message) ||
              /Invalid transaction ID/i.test(err.message))
          )
        ) {
          throw err
        }
      }
    }
  }
}

export default buildFast
