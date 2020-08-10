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

const notify = async (pool, readModelName, { notification }) => {
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
          throw new Error()
        }
      } catch (error) {}

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
