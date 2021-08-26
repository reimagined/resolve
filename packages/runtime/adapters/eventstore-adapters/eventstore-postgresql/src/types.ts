import { Client as Postgres } from 'pg'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
  AdapterTableNames,
  AdapterTableNamesProps,
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

export type PostgresqlAdapterPoolConnectedProps = AdapterPoolConnectedProps &
  AdapterTableNamesProps & {
    Postgres: typeof Postgres
    connectionOptions: any
    databaseName: string
    fullJitter: FullJitter
    coercer: Coercer
    executeStatement: (
      sql: string,
      useDistinctConnection?: boolean
    ) => Promise<any[]>
    escapeId: EscapeFunction
    escape: EscapeFunction
    connection: Postgres
  }

export type PostgresqlAdapterConfig = AdapterConfig &
  AdapterTableNames & {
    user?: string
    database: string
    port?: number
    host?: string
    password?: string
    databaseName?: string
    [key: string]: any
  }

export type AdapterPool = AdapterPoolConnected<PostgresqlAdapterPoolConnectedProps>

export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<PostgresqlAdapterPoolConnectedProps>

export type ConnectionDependencies = {
  Postgres: typeof Postgres
  fullJitter: FullJitter
  escapeId: EscapeFunction
  escape: EscapeFunction
  executeStatement: (
    pool: AdapterPool,
    sql: string,
    useDistinctConnection?: boolean
  ) => Promise<any[]>
  coercer: Coercer
}

export type PostgresResourceConfig = {
  user: PostgresqlAdapterConfig['user']
  database: PostgresqlAdapterConfig['database']
  databaseName: PostgresqlAdapterConfig['databaseName']
  host: PostgresqlAdapterConfig['host']
  port: PostgresqlAdapterConfig['port']
  password: PostgresqlAdapterConfig['password']
}
