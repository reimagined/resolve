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

const wrapHighload: WrapHighloadMethod = async (obj, method, params) => {
  while (true) {
    return await obj[method](params).promise()
  }
}

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    targetEventStore,
    ...connectionOptions
  } = options

  if (databaseName == null || databaseName.constructor !== String) {
    throw new Error(`Wrong database name: ${databaseName}`)
  }

  const rawRdsDataService = new imports.RDSDataService(connectionOptions)

  const rdsDataService: HighloadRdsDataService = {
    executeStatement: wrapHighload.bind<
      null,
      typeof rawRdsDataService,
      'executeStatement',
      [HighloadMethodParameters<'executeStatement', typeof rawRdsDataService>],
      HighloadMethodReturnType<'executeStatement', typeof rawRdsDataService>
    >(null, rawRdsDataService, 'executeStatement'),
  }

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    targetEventStore,
    makeNestedPath,
    ...imports,
  })
}

export default connect
