export type AdapterPool = {
  config: {
    databaseFile: string
    secretsFile: string
    secretsTableName: string
  }
  secretsDatabase: any
  secretsTableName: string
  database: any
  tableName: string
  escapeId: string
}

export type AdapterSpecific = {
  sqlite: any
  tmp: any
  os: any
  fs: any
}
