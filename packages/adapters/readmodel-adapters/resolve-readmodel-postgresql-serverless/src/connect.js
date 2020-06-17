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

const isHighloadError = error =>
  error != null &&
  (/Request timed out/i.test(error.message) ||
    /Remaining connection slots are reserved/i.test(error.message) ||
    /I\/O error occurr?ed/i.test(error.message) ||
    /too many clients already/i.test(error.message) ||
    /in a read-only transaction/i.test(error.message) ||
    error.code === 'ProvisionedThroughputExceededException' ||
    error.code === 'LimitExceededException' ||
    error.code === 'RequestLimitExceeded' ||
    error.code === 'ThrottlingException' ||
    error.code === 'TooManyRequestsException' ||
    error.code === 'NetworkingError')

const wrapHighload = async (obj, method, params) => {
  while (true) {
    try {
      return await obj[method](params).promise()
    } catch (error) {
      if (isHighloadError(error)) {
        const jitterDelay = Math.floor(250 + Math.random() * 750)
        await new Promise(resolve => setTimeout(resolve, jitterDelay))
      } else {
        throw error
      }
    }
  }
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

  const rawRdsDataService = new imports.RDSDataService(connectionOptions)
  const rdsDataService = {
    executeStatement: wrapHighload.bind(
      null,
      rawRdsDataService,
      'executeStatement'
    ),
    beginTransaction: wrapHighload.bind(
      null,
      rawRdsDataService,
      'beginTransaction'
    ),
    commitTransaction: wrapHighload.bind(
      null,
      rawRdsDataService,
      'commitTransaction'
    ),
    rollbackTransaction: wrapHighload.bind(
      null,
      rawRdsDataService,
      'rollbackTransaction'
    )
  }

  const hash512 = str => {
    const hmac = imports.crypto.createHmac('sha512', awsSecretStoreArn)
    hmac.update(str)
    return hmac.digest('hex')
  }

  const executeStatement = imports.executeStatement.bind(null, pool)

  const eventCounters = new Map()

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
    eventCounters,
    ...imports,
    executeStatement,
    hash512
  })
}

export default connect
