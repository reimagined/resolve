/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'
/* eslint-enable import/no-extraneous-dependencies */
import {
  AdapterPool,
  ConnectionDependencies,
  MySQLConnection,
  MysqlAdapterConfig,
} from '../src/types'
import connect from '../src/connect'

jest.mock('../src/get-log')
jest.mock('../src/connect', () => jest.fn())

let mysqlRelatedConfig: any
let pool: AdapterPool
let connectionDependencies: ConnectionDependencies
let connection: MySQLConnection
let config: MysqlAdapterConfig

const mConnect = jest.fn(connect)

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
  connectionDependencies = {
    MySQL,
    escape,
    escapeId,
  }
  config = {
    database: 'database',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsDatabase: 'secrets-database',
    secretsTableName: 'secrets-table-name',
    ...mysqlRelatedConfig,
  }
  mConnect.mockClear()
})

test("MySQL config assigned to adapter's pool", async () => {
  await mConnect(pool, connectionDependencies, config)

  expect(pool.eventsTableName).toEqual('table-name')
})
