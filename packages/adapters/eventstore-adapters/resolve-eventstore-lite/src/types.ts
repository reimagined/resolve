import type { open } from 'sqlite'
export type SqliteOpen = typeof open

export type MemoryStore = {
  name: string
  drop: () => void
}

export type AdapterPool = {
  config: {
    databaseFile: string
    secretsTableName: string
    eventsTableName: string
    snapshotsTableName: string
  }
  maybeThrowResourceError: (error: Error[]) => void
  coerceEmptyString: (obj: any, fallback?: string) => string
  database: any
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  escapeId: (source: string) => string
  escape: (source: string) => string
  memoryStore: MemoryStore
  shapeEvent: (event: any) => any
}

export type AdapterSpecific = {
  sqlite: { open: SqliteOpen }
  tmp: any
  os: any
  fs: any
}
