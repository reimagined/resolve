import type { open, Database } from 'sqlite'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterTableNames,
  AdapterTableNamesProps,
} from '@resolve-js/eventstore-base'
import {
  AdapterConfigSchema,
  AdapterTableNamesSchema,
  UnbrandProps,
  iots as t,
  iotsTypes,
} from '@resolve-js/eventstore-base'

export type SqliteOpen = typeof open

export type MemoryStore = {
  name: string
  drop: () => void
}

export type SqliteAdapterPoolConnectedProps = AdapterPoolConnectedProps &
  AdapterTableNamesProps & {
    database: Database
    databaseFile: string
    escapeId: (source: string) => string
    escape: (source: string) => string
    memoryStore?: MemoryStore
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
  sqlite: { open: SqliteOpen }
  tmp: any
  os: any
  fs: any
}
