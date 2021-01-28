import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
} from 'resolve-eventstore-base'

export type MySQLConnection = {
  execute: (sql: string) => Promise<never>
  query: (sql: string) => Promise<Array<Array<any>>>
  end: () => Promise<never>
}
type MySQLLib = {
  createConnection: (options: any) => MySQLConnection
}

export type MysqlAdapterPoolConnectedProps = AdapterPoolConnectedProps & {
  connection: MySQLConnection
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  database: string
  escapeId: (val: string) => string
  escape: (val: string) => string
  MySQL: MySQLLib
}

export type MysqlAdapterConfig = AdapterConfig & {
  database?: string
  eventsTableName?: string
  snapshotsTableName?: string
  secretsTableName?: string
  [key: string]: any
}

export type AdapterPool = AdapterPoolConnected<MysqlAdapterPoolConnectedProps>
export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<
  MysqlAdapterPoolConnectedProps
>

export type ConnectionDependencies = {
  MySQL: any
  escapeId: (val: string) => string
  escape: (val: string) => string
}
