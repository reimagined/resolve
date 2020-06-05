export type AdapterPool = {
  config: {
    databaseFile: string
    secretsFile: string
    secretsTableName: string
    eventsTableName: string
    snapshotsTableName: string
  }
  secretsDatabase: any
  database: any
  eventsTableName: string
  snapshotsTableName: string
  secretsTableName: string
  escapeId: (source: string) => string
  escape: (source: string) => string
  memoryStore: any
}

export type AdapterSpecific = {
  sqlite: any
  tmp: any
  os: any
  fs: any
}
