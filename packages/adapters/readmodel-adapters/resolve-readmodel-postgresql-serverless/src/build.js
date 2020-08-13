const build = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    inlineLedgerExecuteStatement
  } = pool

  try {
    const databaseNameAsId = escapeId(schemaName)
    const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

    const { transactionId } = await rdsDataService.beginTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres'
    })

    await inlineLedgerExecuteStatement(
      pool,
      `WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         AND "IsPaused" = FALSE
         FOR NO KEY UPDATE NOWAIT
       )
       UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "XaKey" = ${escape(transactionId)}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND (SELECT Count("CTE".*) FROM "CTE") = 1
       AND "IsPaused" = FALSE
      `
    )

    await inlineLedgerExecuteStatement(
      pool,
      `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`,
      transactionId
    )

    let readModelLedger = null
    const rows = await inlineLedgerExecuteStatement(
      pool,
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND "XaKey" = ${escape(transactionId)}
       AND "IsPaused" = FALSE
       FOR NO KEY UPDATE NOWAIT
      `,
      transactionId
    )

    readModelLedger = rows.length === 1 ? rows[0] : null
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
          transactionId
        })

        await next()
      } catch (error) {
        await inlineLedgerExecuteStatement(
          pool,
          `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
           SET "Errors" = jsonb_insert(
             COALESCE("Errors", jsonb('[]')),
             CAST(('{' || jsonb_array_length(COALESCE("Errors", jsonb('[]'))) || '}') AS TEXT[]),
             jsonb(${escape(JSON.stringify(error))})
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
          transactionId
        })
      }

      return
    }

    pool.transactionId = transactionId
    const events = await eventstoreAdapter.loadEvents({
      eventTypes,
      eventsSizeLimit: 256 * 1024,
      limit: 0x7fffffff,
      cursor
    })

    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError = null
    const appliedEvents = []

    for (const event of events) {
      try {
        await projection[event.type](store, event)
        appliedEvents.push(event)
        lastSuccessEvent = event
      } catch (error) {
        lastFailedEvent = event
        lastError = error
        break
      }
    }

    const nextCursor = eventstoreAdapter.getNextCursor(cursor, appliedEvents)
    appliedEvents.length = 0

    if (lastError == null) {
      await inlineLedgerExecuteStatement(
        pool,
        `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
         SET "SuccessEvent" = ${escape(JSON.stringify(lastSuccessEvent))},
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
           jsonb(${escape(JSON.stringify(lastError))})
         ),
         "FailedEvent" = ${escape(JSON.stringify(lastFailedEvent))},
         "Cursor" = ${escape(JSON.stringify(nextCursor))}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `,
        transactionId
      )
    }

    await rdsDataService.commitTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      transactionId
    })

    if (lastError == null) {
      await next()
    }
  } catch (error) {
    if (!(error instanceof PassthroughError)) {
      throw error
    }

    if (error.lastTransactionId != null) {
      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId: error.lastTransactionId
        })
      } catch (err) {}
    }
  }
}

export default build
