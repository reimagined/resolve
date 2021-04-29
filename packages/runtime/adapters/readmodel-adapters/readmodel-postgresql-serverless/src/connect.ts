import type { CurrentConnectMethod, MakeNestedPathMethod } from './types'

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

  const rdsDataService = new imports.RDSDataService(connectionOptions)
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
