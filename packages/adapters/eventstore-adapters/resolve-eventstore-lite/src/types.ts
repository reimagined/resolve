import type { open } from 'sqlite'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
} from 'resolve-eventstore-base'

export type SqliteOpen = typeof open

export type MemoryStore = {
  name: string
  drop: () => void
}

export type SqliteAdapterPoolConnectedProps = AdapterPoolConnectedProps & {
  database: any
  databaseFile: string
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  subscribersTableName: string
  escapeId: (source: string) => string
  escape: (source: string) => string
  memoryStore?: MemoryStore
}

export type SqliteAdapterConfig = AdapterConfig & {
  databaseFile?: string
  secretsTableName?: string
  eventsTableName?: string
  snapshotsTableName?: string
  subscribersTableName?: string
}

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
