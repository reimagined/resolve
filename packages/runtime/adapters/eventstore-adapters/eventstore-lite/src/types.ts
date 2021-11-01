import BetterSqlite from 'better-sqlite3'
import type {
  AdapterBoundPool,
  AdapterPrimalPool,
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

export type ConfiguredProps = AdapterTableNamesProps & {
  database?: BetterSqliteDb
  databaseFile: string
  escapeId: (source: string) => string
  escape: (source: string) => string
  memoryStore?: MemoryStore
  connecting: boolean
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

export type AdapterPool = AdapterBoundPool<ConfiguredProps>
export type AdapterPoolPrimal = AdapterPrimalPool<ConfiguredProps>
