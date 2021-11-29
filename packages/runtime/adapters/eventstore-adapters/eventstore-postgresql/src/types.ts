import { Client } from 'pg'
import type {
  AdapterBoundPool,
  AdapterPrimalPool,
  AdapterConfig,
  AdapterTableNames,
  AdapterTableNamesProps,
} from '@resolve-js/eventstore-base'

type EscapeFunction = (source: string) => string
type FullJitter = (retries: number) => number

type ConnectionOptions = {
  user: string
  database: string
  port: number
  host: string
  password: string
}

export type ConfiguredProps = AdapterTableNamesProps & {
  Postgres: typeof Client
  connectionOptions: ConnectionOptions
  databaseName: string
  fullJitter: FullJitter
  executeStatement: (
    sql: string,
    useDistinctConnection?: boolean
  ) => Promise<any[]>
  escapeId: EscapeFunction
  escape: EscapeFunction
  getVacantTimeInMillis?: () => number
  createGetConnectPromise: () => () => Promise<Client>
  getConnectPromise: () => Promise<Client>
  connection?: Client
}

export type PostgresqlAdapterConfig = AdapterConfig &
  AdapterTableNames &
  ConnectionOptions & {
    databaseName: string
  }

export type AdapterPool = AdapterBoundPool<ConfiguredProps>

export type AdapterPoolPrimal = AdapterPrimalPool<ConfiguredProps>

export type PostgresResourceConfig = {
  user: PostgresqlAdapterConfig['user']
  database: PostgresqlAdapterConfig['database']
  databaseName: PostgresqlAdapterConfig['databaseName']
  host: PostgresqlAdapterConfig['host']
  port: PostgresqlAdapterConfig['port']
  password: PostgresqlAdapterConfig['password']
  userLogin: string
}

export { Client as PostgresConnection }
