import type { CurrentConnectMethod } from './types'

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
    transactionId: null,
    ...imports,
    hash512,
  })
}

export default connect
