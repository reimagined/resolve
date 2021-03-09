import type {
  CurrentConnectMethod,
  MakeNestedPathMethod,
  WrapHighloadMethod,
  HighloadMethodParameters,
  HighloadMethodReturnType,
  HighloadRdsDataService,
} from './types'

const makeNestedPath: MakeNestedPathMethod = (nestedPath) => {
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

const wrapHighload: WrapHighloadMethod = async (
  isHighloadError,
  obj,
  method,
  params
) => {
  while (true) {
    try {
      return await obj[method](params).promise()
    } catch (error) {
      if (isHighloadError(error)) {
        const jitterDelay = Math.floor(250 + Math.random() * 750)
        await new Promise((resolve) => setTimeout(resolve, jitterDelay))
      } else {
        throw error
      }
    }
  }
}

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    tablePrefix,
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

  const rdsDataService: HighloadRdsDataService = {
    executeStatement: wrapHighload.bind<
      null,
      typeof imports.isHighloadError,
      typeof rawRdsDataService,
      'executeStatement',
      [HighloadMethodParameters<'executeStatement', typeof rawRdsDataService>],
      HighloadMethodReturnType<'executeStatement', typeof rawRdsDataService>
    >(null, imports.isHighloadError, rawRdsDataService, 'executeStatement'),
    beginTransaction: wrapHighload.bind<
      null,
      typeof imports.isHighloadError,
      typeof rawRdsDataService,
      'beginTransaction',
      [HighloadMethodParameters<'beginTransaction', typeof rawRdsDataService>],
      HighloadMethodReturnType<'beginTransaction', typeof rawRdsDataService>
    >(null, imports.isHighloadError, rawRdsDataService, 'beginTransaction'),
    commitTransaction: wrapHighload.bind<
      null,
      typeof imports.isHighloadError,
      typeof rawRdsDataService,
      'commitTransaction',
      [HighloadMethodParameters<'commitTransaction', typeof rawRdsDataService>],
      HighloadMethodReturnType<'commitTransaction', typeof rawRdsDataService>
    >(null, imports.isHighloadError, rawRdsDataService, 'commitTransaction'),
    rollbackTransaction: wrapHighload.bind<
      null,
      typeof imports.isHighloadError,
      typeof rawRdsDataService,
      'rollbackTransaction',
      [
        HighloadMethodParameters<
          'rollbackTransaction',
          typeof rawRdsDataService
        >
      ],
      HighloadMethodReturnType<'rollbackTransaction', typeof rawRdsDataService>
    >(null, imports.isHighloadError, rawRdsDataService, 'rollbackTransaction'),
  }

  const hash512 = (str: string): string => {
    const hmac = imports.crypto.createHmac('sha512', awsSecretStoreArn)
    hmac.update(str)
    return hmac.digest('hex')
  }

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName: databaseName,
    tablePrefix,
    makeNestedPath,
    transactionId: null,
    ...imports,
    hash512,
  })
}

export default connect
