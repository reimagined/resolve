// eslint-disable-next-line import/no-extraneous-dependencies
import RDSDataService from 'aws-sdk/clients/rdsdataservice'

export type Coercer = (
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
type EscapeFunction = (source: string) => string
type FullJitter = (retries: number) => number

export type AdminPool = {
  config?: {
    dbClusterOrInstanceArn: string
    awsSecretStoreArn: string
    databaseName: string
    eventsTableName: string
    secretsTableName: string
    snapshotsTableName: string
    region?: string
  }
  RdsDataService?: RDSDataService
  escapeId?: EscapeFunction
  escape?: EscapeFunction
  fullJitter?: FullJitter
  executeStatement?: (sql: string) => Promise<any[]>
  coercer?: Coercer
}

export type AdapterPool = {
  config: {
    dbClusterOrInstanceArn: string
    awsSecretStoreArn: string
    databaseName: string
    eventsTableName: string
    secretsTableName: string
    snapshotsTableName: string
    region?: string
    snapshotBucketSize?: number
  }
  coerceEmptyString: (obj: any, fallback?: string) => string
  rdsDataService: RDSDataService
  dbClusterOrInstanceArn: string
  awsSecretStoreArn: string
  databaseName: string
  eventsTableName: string
  secretsTableName: string
  snapshotsTableName: string
  fullJitter: FullJitter
  coercer: Coercer
  executeStatement: (sql: string) => Promise<any[]>
  escapeId: EscapeFunction
  escape: EscapeFunction
  bucketSize: number
  shapeEvent: (event: any, additionalFields?: any) => any[]
  isTimeoutError: (error: any) => boolean
  beginTransaction: (pool: AdapterPool) => Promise<any>
  commitTransaction: (pool: AdapterPool, transactionId: string) => Promise<void>
  rollbackTransaction: (
    pool: AdapterPool,
    transactionId: string
  ) => Promise<void>
}

export type AdapterSpecific = {
  RDSDataService: typeof RDSDataService
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[]>
  coercer: Coercer
}

export type CloudAdapterSpecific = {
  RDSDataService: typeof RDSDataService
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[]>
  coercer: Coercer
}

export type CloudResource = {
  createResource: (options: CloudResourceOptions) => Promise<any>
  disposeResource: (options: CloudResourceOptions) => Promise<any>
  destroyResource: (options: CloudResourceOptions) => Promise<any>
}

export type CloudResourcePool = {
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[]>
  RDSDataService: typeof RDSDataService
  escapeId: EscapeFunction
  escape: EscapeFunction
  fullJitter: FullJitter
  coercer: Coercer
  shapeEvent: (event: any, additionalFields?: any) => any[]
  connect: (pool: AdapterPool, specific: AdapterSpecific) => Promise<any>
  dispose: (pool: AdapterPool) => Promise<any>
}

export type CloudResourceOptions = {
  region: string
  databaseName: string
  eventsTableName: string
  secretsTableName: string
  snapshotsTableName: string
  userLogin: string
  awsSecretStoreArn: string
  awsSecretStoreAdminArn: string
  dbClusterOrInstanceArn: string
}
