import RDSDataService from 'aws-sdk/clients/rdsdataservice'

type Coercer = (
  value: {
    intValue: number
    stringValue: string
    bigIntValue: number
    longValue: number
    booleanValue: boolean
  } & {
    [key: string]: any
  }
) => number | string | boolean

export type AdapterPool = {
  config: {
    dbClusterOrInstanceArn: string
    awsSecretStoreArn: string
    tableName: string
    databaseName: string
    secretsTableName: string
  }
  rdsDataService: typeof RDSDataService
  dbClusterOrInstanceArn: string
  awsSecretStoreArn: string
  databaseName: string
  secretsTableName: string
  fullJitter: (retries: number) => number
  coercer: Coercer
  executeStatement: (sql: string) => any[]
  tableName: string
  escapeId: (source: string) => string
  escape: (source: string) => string
}

export type AdapterSpecific = {
  RDSDataService: typeof RDSDataService
  fullJitter: (retries: number) => number
  escapeId: (source: string) => string
  escape: (source: string) => string
  executeStatement: (pool: AdapterPool, sql: string) => any[]
  coercer: Coercer
}
