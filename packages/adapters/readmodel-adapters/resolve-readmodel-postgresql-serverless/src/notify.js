const executeStatement = async (pool, transactionId, sql) => {
  const result = await pool.rdsDataService.executeStatement({
    resourceArn: pool.dbClusterOrInstanceArn,
    secretArn: pool.awsSecretStoreArn,
    database: 'postgres',
    continueAfterTimeout: false,
    includeResultMetadata: true,
    transactionId,
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
}

const passthroughError = new Error('PASSTHROUGH ERROR')

const isPassthroughError = error =>
  (error != null && /deadlock/.match(error.message)) ||
  error === passthroughError

const notify = async (pool, readModelName, store, projection, notification) => {
  const {
    eventstoreAdapter,
    databaseName,
    escapeId,
    escape,
    rdsDataService
  } = pool
  const databaseNameAsId = escapeId(databaseName)
  const ledgerTableNameAsId = escapeId(`__${databaseName}__LEDGER__`)

  switch (notification) {
    case 'BUILD': {
      const { transactionId } = await rdsDataService.beginTransaction({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        database: 'postgres'
      })
      let readModelLedger = null
      try {
        const rows = await executeStatement(
          pool,
          transactionId,
          `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
           WHERE "EventSubscriber" = ${escape(readModelName)}
           FOR UPDATE`
        )
        if (rows.length !== 1) {
          throw passthroughError
        }
        readModelLedger = rows[0]
      } catch (error) {
        if (isPassthroughError(error)) {
          return
        }
      }

      const eventTypes = JSON.parse(readModelLedger.eventTypes)
      if (!Array.isArray(eventTypes)) {
        throw new TypeError('eventTypes')
      }

      const events = await eventstoreAdapter.loadEvents({
        eventTypes,
        eventsSizeLimit: 256 * 1024,
        limit: 0x7fffffff
      })

      let lastSuccessEvent = null
      let lastFailedEvent = null
      let lastError = null

      for (const event of events) {
        try {
          await projection[event.type](store, event)
          lastSuccessEvent = event
        } catch (error) {
          lastFailedEvent = event
          lastError = error
          break
        }
      }

      break
    }

    case 'SUBSCRIBE': {
      break
    }

    case 'RESUBSCRIBE': {
      break
    }

    case 'UNSUBSCRIBE': {
      break
    }

    case 'PAUSE': {
      break
    }

    case 'RESUME': {
      break
    }

    case 'RESET': {
      break
    }

    default: {
      throw new Error(
        `Invalid notification "${notification}" for read-model ${readModelName}`
      )
    }
  }
}

export default notify
