import { Client as Postgres } from 'pg'

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
type EscapeFunction = (source: string) => string
type FullJitter = (retries: number) => number

export type AdapterPool = {
  config?: {
    user: string
    database: string
    port: string
    host: string
    password: string
    databaseName: string
    eventsTableName: string
    snapshotsTableName: string
    secretsTableName: string
  }
  Postgres?: typeof Postgres
  user?: string
  database?: string
  port?: string
  host?: string
  password?: string
  databaseName?: string
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName?: string
  fullJitter?: FullJitter
  coercer?: Coercer
  executeStatement?: (sql: string) => Promise<any[] | null>
  escapeId?: EscapeFunction
  escape?: EscapeFunction
}

export type AdapterSpecific = {
  Postgres: typeof Postgres
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[] | null>
  coercer: Coercer
}
