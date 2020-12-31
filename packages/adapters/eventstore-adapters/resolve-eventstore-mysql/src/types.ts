export type MySQLConnection = {
  execute: (sql: string) => Promise<never>
  query: (sql: string) => Promise<Array<Array<any>>>
  end: () => Promise<never>
}
type MySQLLib = {
  createConnection: (options: any) => MySQLConnection
}

export type AdapterPool = {
  config: {
    database: string
    eventsTableName: string
    snapshotsTableName: string
    secretsTableName?: string
    snapshotBucketSize?: string
  }
  maybeThrowResourceError: (error: Error[]) => void
  coerceEmptyString: (obj: any, fallback?: string) => string
  connection: MySQLConnection
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  database: string
  escapeId: (val: string) => string
  escape: (val: string) => string
  MySQL: MySQLLib
  shapeEvent: (event: any) => any
}

export type AdapterSpecific = {
  MySQL: any
  escapeId: (val: string) => string
  escape: (val: string) => string
}
