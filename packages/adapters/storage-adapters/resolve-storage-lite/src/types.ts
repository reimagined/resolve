export type AdapterPool = {
  config: {
    databaseFile: string
    secretsFile: string
  }
  secretsDatabase: any
}

export type AdapterSpecific = {
  sqlite: any
  tmp: any
  os: any
  fs: any
}
