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

const wrapHighload = async (isHighloadError, obj, method, params) => {
  const beginTime = Date.now()
  let retries = 0
  while (true) {
    try {
      const result = await obj[method](params).promise()
      if(retries > 1) {
        const endTime = Date.now()
        console.log(`Method ${method} jittered ${retries} times [${endTime - beginTime} ms]`)
      }

      return result
    } catch (error) {
      if (isHighloadError(error)) {
        //const jitterDelay = Math.floor(2 + Math.random() * 7)
        const jitterDelay = Math.floor(250 + Math.random() * 750)
        await new Promise(resolve => setTimeout(resolve, jitterDelay))
        retries++
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
      imports.isHighloadError,
      rawRdsDataService,
      'executeStatement'
    ),
    beginTransaction: wrapHighload.bind(
      null,
      imports.isHighloadError,
      rawRdsDataService,
      'beginTransaction'
    ),
    commitTransaction: wrapHighload.bind(
      null,
      imports.isHighloadError,
      rawRdsDataService,
      'commitTransaction'
    ),
    rollbackTransaction: wrapHighload.bind(
      null,
      imports.isHighloadError,
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
