// eslint-disable-next-line no-new-func
const PassthroughError = Function()
Object.setPrototypeOf(PassthroughError.prototype, Error.prototype)
const generatePassthroughError = (lastTransactionId) => {
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
  error != null && (
    /deadlock detected/.test(error.message) ||
    /could not obtain lock/.test(error.message)
  )

const executeStatement = async (pool, sql, transactionId) => {
  try {
    const result = await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
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
        row[columnMetadata[i].name] = pool.coercer(record[i])
      }
      rows.push(row)
    }

    return rows
  } catch(error) {
    if(isPassthroughError(error)) {
      throw generatePassthroughError(transactionId)
    }
    throw error
  }
}

const build = async (
  pool,
  readModelName,
  doNotify,
  store,
  projection
) => {
  const {
    eventstoreAdapter,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    escapeId,
    escape,
    rdsDataService
  } = pool
  const databaseNameAsId = escapeId(databaseName)
  const ledgerTableNameAsId = escapeId(`__${databaseName}__LEDGER__`)

  const { transactionId } = await rdsDataService.beginTransaction({
    resourceArn: dbClusterOrInstanceArn,
    secretArn: awsSecretStoreArn,
    database: 'postgres'
  })
  pool.transactionId = transactionId

  await executeStatement(
    pool,
    `WITH "CTE" AS (
       SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
       WHERE "EventSubscriber" = ${escape(readModelName)}
       FOR NO KEY UPDATE NOWAIT
     )
     UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "XaKey" = ${escape(transactionId)}
     WHERE "EventSubscriber" = ${escape(readModelName)}
     AND Count(SELECT * FROM "CTE") = 1
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
     FOR NO KEY UPDATE NOWAIT
    `,
    transactionId
  )

  readModelLedger = rows.length === 1 ? rows[0] : null
  if(readModelLedger == null || readModelLedger.Errors != null) {
    throw generatePassthroughError(transactionId)
  }

  const eventTypes = JSON.parse(readModelLedger.EventTypes)
  if (!Array.isArray(eventTypes)) {
    throw new TypeError('eventTypes')
  }

  const cursor =
    readModelLedger.Cursor != null
      ? JSON.parse(readModelLedger.Cursor)
      : null

  if (cursor != null && cursor.constructor !== String) {
    throw new TypeError('cursor')
  }

  if (cursor == null && typeof projection.Init === 'function') {
    const nextCursor = eventstoreAdapter.getNextCursor(null, [])
    try {
      await projection.Init(store)

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
  
      await doNotify('BUILD')
    } catch(error) {
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
    }

    await rdsDataService.commitTransaction({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      transactionId
    })

    return
  }

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

  if(lastError == null) {
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

  if(lastError == null) {
    await doNotify('BUILD')
  }
}

const forceStop = async (pool, readModelName) => {
  const databaseNameAsId = pool.escapeId(pool.databaseName)
  const ledgerTableNameAsId = pool.escapeId(`__${pool.databaseName}__LEDGER__`)
  while(true) {
    try {
      const rows = await executeStatement(pool,
        `SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `
      )
      if(rows.length !== 1) {
        break
      }
      const transactionId = rows[0].XaKey

      await pool.rdsDataService.rollbackTransaction({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        transactionId
      })
      
      break
    } catch(err) {
      continue
    }
  }
}

const subscribe = async (pool, readModelName, doNotify) => {
  
}

const notify = async (
  pool,
  readModelName,
  doNotify,
  store,
  projection,
  notification
) => {
  try {
    switch (notification) {
      case 'BUILD': {
        return await build(pool, readModelName, doNotify, store, projection)
      }
      case 'SUBSCRIBE': {
        return await subscribe(pool, readModelName, doNotify)
      }
      case 'RESUBSCRIBE': {
        return await resubscribe(pool, readModelName, doNotify)
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
  } catch(error) {
    if(!(error instanceof PassthroughError)) {
      throw error
    }
    
    if(error.lastTransactionId != null) {
      try {
        await pool.rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId: error.lastTransactionId
        })
      } catch(err) {}
    }
  } 

}

export default notify
