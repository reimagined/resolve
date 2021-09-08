import BetterSqlite from 'better-sqlite3'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterTableNamesProps,
} from '@resolve-js/eventstore-base'
import {
  AdapterConfigSchema,
  AdapterTableNamesSchema,
  UnbrandProps,
  iots as t,
  iotsTypes,
} from '@resolve-js/eventstore-base'

export type MemoryStore = {
  name: string
  drop: () => void
}

export type BetterSqliteDb = typeof BetterSqlite['prototype']

export type SqliteAdapterPoolConnectedProps = AdapterPoolConnectedProps &
  AdapterTableNamesProps & {
    database: BetterSqliteDb
    databaseFile: string
    escapeId: (source: string) => string
    escape: (source: string) => string
    memoryStore?: MemoryStore
    executeStatement: (sql: string) => Promise<any[]>
    executeQuery: (sql: string) => Promise<void>
  }

export const SqliteAdapterConfigSchema = t.intersection([
  AdapterConfigSchema,
  AdapterTableNamesSchema,
  t.partial({
    databaseFile: iotsTypes.NonEmptyString,
  }),
])

type SqliteAdapterConfigChecked = t.TypeOf<typeof SqliteAdapterConfigSchema>
export type SqliteAdapterConfig = UnbrandProps<SqliteAdapterConfigChecked>

export type AdapterPool = AdapterPoolConnected<SqliteAdapterPoolConnectedProps>
export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<SqliteAdapterPoolConnectedProps>

export type ConnectionDependencies = {
  BetterSqlite: typeof BetterSqlite
  tmp: any
  os: any
  fs: any
}
