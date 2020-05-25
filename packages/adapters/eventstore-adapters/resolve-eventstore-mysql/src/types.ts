type MySQLConnection = {
  execute: (sql: string) => Promise<never>
  query: (sql: string) => Promise<Array<Array<any>>>
  end: () => Promise<never>
}
type MySQLLib = {
  createConnection: (options: any) => MySQLConnection
}

export type AdapterPool = {
  config: {
    database: string
    tableName?: string
    secretsDatabase?: string
    secretsTableName?: string
  }
  events: {
    connection: MySQLConnection
    tableName: string
    database: string
  }
  secrets: {
    connection: MySQLConnection
    tableName: string
    database: string
  }
  escapeId: (val: string) => string
  escape: (val: string) => string
  MySQL: MySQLLib
}

export type AdapterSpecific = {
  MySQL: any
  escapeId: (val: string) => string
  escape: (val: string) => string
}
