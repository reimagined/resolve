const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const buildSlow = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    inlineLedgerExecuteStatement,
    generateGuid,
  } = pool

  try {
    const databaseNameAsId = escapeId(schemaName)
    const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
    const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    await inlineLedgerExecuteStatement(
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
      `
    )

    const { transactionId } = await rdsDataService.beginTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
    })

    await inlineLedgerExecuteStatement(
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
      )
      `
    )

    const rootSavePointId = generateGuid(transactionId, 'ROOT')

    await inlineLedgerExecuteStatement(
      pool,
      `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
       SAVEPOINT ${rootSavePointId}
      `,
      transactionId
    )

    const rows = await inlineLedgerExecuteStatement(
      pool,
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND "XaKey" = ${escape(xaKey)}
       AND "IsPaused" = FALSE
       AND "Errors" IS NULL
       FOR NO KEY UPDATE NOWAIT
      `,
      transactionId
    )

    let readModelLedger = rows.length === 1 ? rows[0] : null
    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError(transactionId)
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

    if (cursor == null) {
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

      return
    }

    pool.transactionId = transactionId
    const { events } = await eventstoreAdapter.loadEvents({
      eventTypes,
      eventsSizeLimit: 1024 * 1024,
      limit: 10,
      cursor,
    })

    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError = null
    const appliedEvents = []

    try {
      for (const event of events) {
        const savePointId = generateGuid(
          transactionId,
          `${appliedEvents.length}`
        )
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
          appliedEvents.push(event)
        } catch (error) {
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
      appliedEvents.length = 0
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

    const nextCursor = eventstoreAdapter.getNextCursor(cursor, appliedEvents)

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

    if (lastError == null && appliedEvents.length > 0) {
      await next()
    }

    appliedEvents.length = 0
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

export default buildSlow
