export type AdapterPool = {
  config: {
    database: string
    tableName?: string
    secretsDatabase?: string
    secretsTableName?: string
  }
  events: {
    connection: any
    tableName: string
    database: string
  }
  secrets: {
    connection: any
    tableName: string
    database: string
  }
}

export type AdapterSpecific = {
  MySQL: any
  escapeId: (val: string) => string
  escape: (val: string) => string
}
