import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
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

export type MysqlAdapterPoolConnectedProps = AdapterPoolConnectedProps &
  AdapterTableNamesProps & {
    connection: MySQLConnection
    database: string
    escapeId: (val: string) => string
    escape: (val: string) => string
  }

export type MysqlAdapterConfig = AdapterConfig &
  AdapterTableNames & {
    database: string
    [key: string]: any
  }

export type AdapterPool = AdapterPoolConnected<MysqlAdapterPoolConnectedProps>
export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<MysqlAdapterPoolConnectedProps>

export type ConnectionDependencies = {
  MySQL: MySQLLib
  escapeId: (val: string) => string
  escape: (val: string) => string
}
