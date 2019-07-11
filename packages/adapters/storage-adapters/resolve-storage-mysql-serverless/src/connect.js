const coercer = ({ intValue, stringValue, bigIntValue, ...rest }) => {
  if (intValue != null) {
    return Number(intValue)
  } else if (bigIntValue != null) {
    return Number(bigIntValue)
  } else if (stringValue != null) {
    return String(stringValue)
  } else {
    throw new Error(`Unknown type ${JSON.stringify(rest)}`)
  }
}

const executeSql = async (pool, sql) => {
  const result = await pool.rdsDataService
    .executeSql({
      awsSecretStoreArn: pool.config.awsSecretStoreArn,
      dbClusterOrInstanceArn: pool.config.dbClusterOrInstanceArn,
      database: pool.config.database,
      sqlStatements: sql
    })
    .promise()

  if (
    !Array.isArray(result.sqlStatementResults) ||
    result.sqlStatementResults.length !== 1
  ) {
    return null
  }

  const firstResult = result.sqlStatementResults[0]

  if (firstResult == null || firstResult.resultFrame == null) {
    return null
  }

  const {
    resultFrame: { records, resultSetMetadata }
  } = firstResult

  if (!Array.isArray(records) || resultSetMetadata == null) {
    return null
  }

  const { columnCount, columnMetadata } = resultSetMetadata

  const rows = []
  for (const { values } of records) {
    const row = {}
    for (let i = 0; i < columnCount; i++) {
      row[columnMetadata[i].name] = coercer(values[i])
    }
    rows.push(row)
  }

  return rows
}

const connect = async (pool, { RDSDataService, escapeId, escape }) => {
  const rdsDataService = new RDSDataService({ region: pool.config.region })

  Object.assign(pool, {
    tableName: pool.config.tableName,
    rdsDataService,
    executeSql: executeSql.bind(null, pool),
    escapeId,
    escape
  })
}

export default connect
