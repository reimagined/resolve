const serializeError = error =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack)
      }
    : null

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

  console.log('BUILD STARTED')

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
         AND "Errors" IS NULL
         FOR NO KEY UPDATE NOWAIT
       )
       UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "XaKey" = ${escape(transactionId)}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND (SELECT Count("CTE".*) FROM "CTE") = 1
       AND "IsPaused" = FALSE
       AND "Errors" IS NULL
      `
    )

    await inlineLedgerExecuteStatement(
      pool,
      `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`,
      transactionId
    )

    const rows = await inlineLedgerExecuteStatement(
      pool,
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       AND "XaKey" = ${escape(transactionId)}
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
          transactionId
        })
      }

      console.log('BUILD END BY FLOW (I)')
      return
    }

    pool.transactionId = transactionId
    const { events } = await eventstoreAdapter.loadEvents({
      eventTypes,
      eventsSizeLimit: 1024 * 1024,
      limit: 0x7fffffff,
      cursor
    })
    if(events.length === 0) {
      console.log(`${readModelName}: Empty batch`)
    } else {
      console.log(`${readModelName}: Batch size ${events.length}`)
    }

    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError = null
    const appliedEvents = []

    for (const event of events) {
      try {
        if (typeof projection[event.type] === 'function') {
          await projection[event.type](store, event)
          appliedEvents.push(event)
          lastSuccessEvent = event
        }
      } catch (error) {
        lastFailedEvent = event
        lastError = error
        break
      }
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

    if (lastError == null && appliedEvents.length > 0) {
      await next()
    }

    appliedEvents.length = 0

    console.log('BUILD END BY FLOW (II)')
  } catch (error) {
    if (!(error instanceof PassthroughError)) {
      throw error
    }

    console.log('BUILD END BY MUTEX')

    if (error.lastTransactionId != null) {
      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId: error.lastTransactionId
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

export default build
