/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, MySQLConnection, MysqlAdapterConfig } from '../src/types'
import configure from '../src/configure'

jest.mock('../src/get-log')
jest.mock('../src/connect', () => jest.fn())

let mysqlRelatedConfig: any
let pool: AdapterPool
let connection: MySQLConnection
let config: MysqlAdapterConfig

beforeEach(() => {
  mysqlRelatedConfig = {
    mysqlRelatedOption: 'mysql-option',
  }
  pool = {
    connection,
    escape: jest.fn(),
    escapeId: jest.fn(),
    maybeThrowResourceError: jest.fn(),
    shapeEvent: jest.fn(),
    database: 'database',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsTableName: 'secrets-table-name',
  } as any
  config = {
    database: 'database',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsDatabase: 'secrets-database',
    secretsTableName: 'secrets-table-name',
    ...mysqlRelatedConfig,
  }
})

test("MySQL config assigned to adapter's pool", async () => {
  configure(pool, config)

  expect(pool.eventsTableName).toEqual('table-name')
})
