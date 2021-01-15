import { Client as Postgres } from 'pg'

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

export type AdapterPool = {
  config: {
    user?: string
    database?: any
    port?: number
    host?: string
    password?: string
    databaseName?: string
    eventsTableName?: string
    snapshotsTableName?: string
    secretsTableName?: string
  }
  maybeThrowResourceError: (error: Error[]) => void
  coerceEmptyString: (obj: any, fallback?: string) => string
  Postgres: typeof Postgres
  connectionOptions: any
  databaseName: string
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  fullJitter: FullJitter
  coercer: Coercer
  executeStatement: (sql: string) => Promise<any[]>
  escapeId: EscapeFunction
  escape: EscapeFunction
  shapeEvent: (event: any, additionalFields?: any) => any[]
}

export type AdapterSpecific = {
  Postgres: typeof Postgres
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[]>
  coercer: Coercer
}
