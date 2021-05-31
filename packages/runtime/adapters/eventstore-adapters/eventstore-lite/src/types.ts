import type { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
} from '@resolve-js/eventstore-base'
import {
  AdapterConfigSchema,
  UnbrandProps,
  iots as t,
  iotsTypes,
} from '@resolve-js/eventstore-base'

export type SqliteDriver = typeof sqlite3.Database
export type SqliteOpen = typeof open

export type MemoryStore = {
  name: string
  drop: () => void
}

export type SqliteAdapterPoolConnectedProps = AdapterPoolConnectedProps & {
  database: Database
  databaseFile: string
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  subscribersTableName: string
  escapeId: (source: string) => string
  escape: (source: string) => string
  memoryStore?: MemoryStore
}

export const SqliteAdapterConfigSchema = t.intersection([
  AdapterConfigSchema,
  t.partial({
    databaseFile: iotsTypes.NonEmptyString,
    secretsTableName: iotsTypes.NonEmptyString,
    eventsTableName: iotsTypes.NonEmptyString,
    snapshotsTableName: iotsTypes.NonEmptyString,
    subscribersTableName: iotsTypes.NonEmptyString,
  }),
])

type SqliteAdapterConfigChecked = t.TypeOf<typeof SqliteAdapterConfigSchema>
export type SqliteAdapterConfig = UnbrandProps<SqliteAdapterConfigChecked>

export type AdapterPool = AdapterPoolConnected<SqliteAdapterPoolConnectedProps>
export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<
  SqliteAdapterPoolConnectedProps
>

export type ConnectionDependencies = {
  sqlite: { open: SqliteOpen; driver: SqliteDriver }
  tmp: any
  os: any
  fs: any
}
