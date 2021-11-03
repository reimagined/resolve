import type {
  AdapterBoundPool,
  AdapterPrimalPool,
  AdapterConfig,
  AdapterTableNames,
  AdapterTableNamesProps,
} from '@resolve-js/eventstore-base'

export type MySQLConnection = {
  execute: (sql: string) => Promise<never>
  query: (sql: string) => Promise<Array<Array<any>>>
  end: () => Promise<never>
}
type MySQLLib = {
  createConnection: (options: any) => MySQLConnection
}

export type ConfiguredProps = AdapterTableNamesProps & {
  database: string
  query: (sql: string) => Promise<any[][]>
  execute: (sql: string) => Promise<void>
  escapeId: (val: string) => string
  escape: (val: string) => string
  connectionOptions: any
  createGetConnectPromise: () => () => Promise<void>
  getConnectPromise: () => Promise<void>
  connection?: MySQLConnection
}

export type MysqlAdapterConfig = AdapterConfig &
  AdapterTableNames & {
    database: string
    [key: string]: any
  }

export type AdapterPool = AdapterBoundPool<ConfiguredProps>

export type AdapterPoolPrimal = AdapterPrimalPool<ConfiguredProps>
