// eslint-disable-next-line no-new-func
const PassthroughError = Function()
Object.setPrototypeOf(PassthroughError.prototype, Error.prototype)
const generatePassthroughError = lastTransactionId => {
  const error = new Error('PassthroughError')
  Object.setPrototypeOf(error, PassthroughError.prototype)
  Object.defineProperties(error, {
    lastTransactionId: { value: lastTransactionId, enumerable: false },
    name: { value: 'PassthroughError', enumerable: true },
    message: { value: error.message, enumerable: true },
    stack: { value: error.stack, enumerable: true }
  })
  return error
}

const isPassthroughError = error =>
  error != null &&
  (/Transaction .*? Is Not Found/i.test(error.message) ||
    /deadlock detected/.test(error.message) ||
    /could not obtain lock/.test(error.message))

const executeStatement = async (pool, sql, transactionId) => {
  const {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    coercer
  } = pool
  try {
    const result = await rdsDataService.executeStatement({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: true,
      ...(transactionId != null ? { transactionId } : {}),
      sql
    })

    const { columnMetadata, records } = result

    if (!Array.isArray(records) || columnMetadata == null) {
      return null
    }

    const rows = []
    for (const record of records) {
      const row = {}
      for (let i = 0; i < columnMetadata.length; i++) {
        row[columnMetadata[i].name] = coercer(record[i])
      }
      rows.push(row)
    }

    return rows
  } catch (error) {
    if (isPassthroughError(error)) {
      throw generatePassthroughError(transactionId)
    }

      console.warn(error)

    throw error
  }
}

const build = async (pool, readModelName, doNotify, store, projection) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService
  } = pool
  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  const { transactionId } = await rdsDataService.beginTransaction({
    resourceArn: dbClusterOrInstanceArn,
    secretArn: awsSecretStoreArn,
    database: 'postgres'
  })

  await executeStatement(
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

  await executeStatement(
    pool,
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`,
    transactionId
  )

  let readModelLedger = null
  const rows = await executeStatement(
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
    throw generatePassthroughError(transactionId)
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

      await executeStatement(
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

      await doNotify({ notification: 'BUILD' })
    } catch (error) {
      await executeStatement(
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
    await executeStatement(
      pool,
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
       SET "SuccessEvent" = ${escape(JSON.stringify(lastSuccessEvent))},
       "Cursor" = ${escape(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escape(readModelName)}
      `,
      transactionId
    )
  } else {
    await executeStatement(
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
    await doNotify({ notification: 'BUILD' })
  }
}

const forceStop = async (pool, readModelName) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  while (true) {
    try {
      const rows = await executeStatement(
        pool,
        `SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `
      )
      if (rows.length < 1) {
        break
      }
      const transactionId = rows[0].XaKey

      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId
        })
      } catch (err) {}

      break
    } catch (error) {
      if (isPassthroughError(error)) {
        continue
      }


        console.warn(error)


      throw error
    }
  }
}

const pause = async (pool, readModelName) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {
      console.warn(err)
    }
  }
}

const resume = async (
  pool,
  readModelName,
  doNotify /*, eventTypes, aggregateIds*/
) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = FALSE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {
      console.warn(err)
    }
  }

  await doNotify({
    notification: 'BUILD'
  })
}

const reset = async (pool, readModelName, doNotify) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    dropReadModel
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {
      console.warn(err)
    }
  }

  await dropReadModel(pool, readModelName)

  while (true) {
    try {
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = FALSE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {}
  }

  await doNotify({ notification: 'BUILD' })
}

const subscribe = async (
  pool,
  readModelName,
  doNotify,
  eventTypes,
  aggregateIds
) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)

      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
         ) VALUES (
           ${escape(readModelName)},
           ${
             eventTypes != null
               ? escape(JSON.stringify(eventTypes))
               : 'NULL'
           },
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : 'NULL'
           },
           COALESCE(NULLIF((SELECT Count("CTE".*) FROM "CTE"), 1), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null ? escape(JSON.stringify(eventTypes)) : 'NULL'
         },
         "AggregateIds" = ${
           aggregateIds != null
             ? escape(JSON.stringify(aggregateIds))
             : 'NULL'
         }
      `
      )
      break
    } catch (err) {}
  }
}

const resubscribe = async (
  pool,
  readModelName,
  doNotify,
  eventTypes,
  aggregateIds
) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    dropReadModel
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {}
  }

  await dropReadModel(pool, readModelName)

  while (true) {
    try {
      await forceStop(pool, readModelName)

      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
         ) VALUES (
           ${escape(readModelName)},
           ${
             eventTypes != null
               ? escape(JSON.stringify(eventTypes))
               : 'NULL'
           },
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : 'NULL'
           },
           COALESCE(NULLIF((SELECT Count("CTE".*) FROM "CTE"), 1), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null ? escape(JSON.stringify(eventTypes)) : 'NULL'
         },
         "AggregateIds" = ${
           aggregateIds != null
             ? escape(JSON.stringify(aggregateIds))
             : 'NULL'
         }
      `
      )
      break
    } catch (err) {}
  }
}

const unsubscribe = async (pool, readModelName) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    dropReadModel
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await forceStop(pool, readModelName)
      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

      break
    } catch (err) {}
  }

  await dropReadModel(pool, readModelName)

  while (true) {
    try {
      await forceStop(pool, readModelName)

      await executeStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR UPDATE NOWAIT
        )
         DELETE FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )
      break
    } catch (err) {}
  }
}

const notify = async (
  pool,
  readModelName,
  doNotify,
  store,
  projection,
  { notification, eventTypes, aggregateIds }
) => {
  const {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
  } = pool

  try {
    switch (notification) {
      case 'BUILD': {
        return await build(pool, readModelName, doNotify, store, projection)
      }
      case 'SUBSCRIBE': {
        return await subscribe(
          pool,
          readModelName,
          doNotify,
          eventTypes,
          aggregateIds
        )
      }
      case 'RESUBSCRIBE': {
        return await resubscribe(
          pool,
          readModelName,
          doNotify,
          eventTypes,
          aggregateIds
        )
      }
      case 'UNSUBSCRIBE': {
        return await unsubscribe(pool, readModelName, doNotify)
      }
      case 'PAUSE': {
        return await pause(pool, readModelName, doNotify)
      }
      case 'RESUME': {
        return await resume(pool, readModelName, doNotify)
      }
      case 'RESET': {
        return await reset(pool, readModelName, doNotify)
      }
      default: {
        throw new Error(
          `Invalid notification "${notification}" for read-model ${readModelName}`
        )
      }
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

export default notify
