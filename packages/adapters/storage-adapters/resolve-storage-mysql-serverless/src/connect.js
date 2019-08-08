const coercer = ({
  intValue,
  stringValue,
  bigIntValue,
  longValue,
  ...rest
}) => {
  if (intValue != null) {
    return Number(intValue)
  } else if (bigIntValue != null) {
    return Number(bigIntValue)
  } else if (longValue != null) {
    return Number(longValue)
  } else if (stringValue != null) {
    return String(stringValue)
  } else {
    throw new Error(`Unknown type ${JSON.stringify(rest)}`)
  }
}

const executeStatement = async (pool, sql, transactionId = null) => {
  const result = await pool.rdsDataService
    .executeStatement({
      ...(transactionId != null ? { transactionId } : {}),
      resourceArn: pool.config.dbClusterOrInstanceArn,
      secretArn: pool.config.awsSecretStoreArn,
      database: pool.config.databaseName,
      continueAfterTimeout: false,
      includeResultMetadata: true,
      sql
    })
    .promise()

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
}

const beginTransaction = async pool => {
  const { transactionId } = await pool.rdsDataService
    .beginTransaction({
      resourceArn: pool.config.dbClusterOrInstanceArn,
      secretArn: pool.config.awsSecretStoreArn,
      database: pool.config.databaseName
    })
    .promise()

  return transactionId
}

const commitTransaction = async (pool, transactionId) => {
  const { transactionStatus } = await pool.rdsDataService
    .commitTransaction({
      resourceArn: pool.config.dbClusterOrInstanceArn,
      secretArn: pool.config.awsSecretStoreArn,
      transactionId
    })
    .promise()

  return transactionStatus
}

const rollbackTransaction = async (pool, transactionId) => {
  const { transactionStatus } = await pool.rdsDataService
    .rollbackTransaction({
      resourceArn: pool.config.dbClusterOrInstanceArn,
      secretArn: pool.config.awsSecretStoreArn,
      transactionId
    })
    .promise()

  return transactionStatus
}

const connect = async (
  pool,
  { RDSDataService, escapeId, escapeUnicode, escape }
) => {
  const rdsDataService = new RDSDataService({ region: pool.config.region })

  Object.assign(pool, {
    tableName: pool.config.tableName,
    rdsDataService,
    executeStatement: executeStatement.bind(null, pool),
    beginTransaction: beginTransaction.bind(null, pool),
    commitTransaction: commitTransaction.bind(null, pool),
    rollbackTransaction: rollbackTransaction.bind(null, pool),
    escapeUnicode,
    escapeId,
    escape,
    resourceOptions: pool.config.resourceOptions
  })
}

export default connect
