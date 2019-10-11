const makeNestedPath = nestedPath => {
  const jsonPathParts = []
  for (const part of nestedPath) {
    if (part == null || part.constructor !== String) {
      throw new Error('Invalid JSON path')
    }
    if (!isNaN(+part)) {
      jsonPathParts.push(String(+part))
    } else {
      jsonPathParts.push(JSON.stringify(part))
    }
  }
  return `{${jsonPathParts.join(',')}}`
}

const connect = async (imports, pool, options) => {
  let {
    performanceTracer,
    tablePrefix,
    databaseName,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    ...connectionOptions
  } = options

  if (databaseName == null || databaseName.constructor !== String) {
    throw new Error(`Wrong database name: ${databaseName}`)
  }

  if (tablePrefix != null && tablePrefix.constructor !== String) {
    throw new Error(`Wrong table prefix: ${tablePrefix}`)
  } else if (tablePrefix == null) {
    tablePrefix = ''
  }

  const rdsDataService = new imports.RDSDataService(connectionOptions)

  const executeStatement = imports.executeStatement.bind(null, pool)

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    performanceTracer,
    schemaName: databaseName,
    tablePrefix,
    makeNestedPath,
    transactionId: null,
    readModelName: null,
    ...imports,
    executeStatement
  })
}

export default connect
