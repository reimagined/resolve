import type { open, Database } from 'sqlite'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
} from '@resolve-js/eventstore-base'
import {
  AdapterConfigSchema,
  UnbrandProps,
  iots as t,
} from '@resolve-js/eventstore-base'

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
    databaseFile: t.string,
    secretsTableName: t.string,
    eventsTableName: t.string,
    snapshotsTableName: t.string,
    subscribersTableName: t.string,
  }),
])

type SqliteAdapterConfigChecked = t.TypeOf<typeof SqliteAdapterConfigSchema>
export type SqliteAdapterConfig = UnbrandProps<SqliteAdapterConfigChecked>

export type AdapterPool = AdapterPoolConnected<SqliteAdapterPoolConnectedProps>
export type AdapterPoolPrimal = AdapterPoolPossiblyUnconnected<
  SqliteAdapterPoolConnectedProps
>

export type ConnectionDependencies = {
  sqlite: { open: SqliteOpen }
  tmp: any
  os: any
  fs: any
}
