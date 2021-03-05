import { Client as Postgres } from 'pg'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
} from '@resolve-js/eventstore-base'

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

export type PostgresqlAdapterPoolConnectedProps = AdapterPoolConnectedProps & {
  Postgres: typeof Postgres
  connectionOptions: any
  databaseName: string
  eventsTableName: string
  snapshotsTableName: string
  subscribersTableName: string
  secretsTableName: string
  fullJitter: FullJitter
  coercer: Coercer
  executeStatement: (sql: string) => Promise<any[]>
  escapeId: EscapeFunction
  escape: EscapeFunction
}

export type PostgresqlAdapterConfig = AdapterConfig & {
  user?: string
  database: string
  port?: number
  host?: string
  password?: string
  databaseName?: string
  eventsTableName?: string
  snapshotsTableName?: string
  subscribersTableName?: string
  secretsTableName?: string
  [key: string]: any
}

export type AdapterPool = AdapterPoolConnected<
  PostgresqlAdapterPoolConnectedProps
>

export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<
  PostgresqlAdapterPoolConnectedProps
>

export type ConnectionDependencies = {
  Postgres: typeof Postgres
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (pool: AdapterPool, sql: string) => Promise<any[]>
  coercer: Coercer
}
