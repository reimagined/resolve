/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific, MySQLConnection } from '../src/types'
import connect from '../src/connect'

jest.mock('../src/get-log')
jest.mock('../src/connect', () => jest.fn())

let mysqlRelatedConfig: any
let pool: AdapterPool
let specific: AdapterSpecific
let connection: MySQLConnection

const mConnect = jest.fn(connect)

beforeEach(() => {
  mysqlRelatedConfig = {
    mysqlRelatedOption: 'mysql-option',
  }
  pool = {
    config: {
      database: 'database',
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
      secretsDatabase: 'secrets-database',
      secretsTableName: 'secrets-table-name',
      ...mysqlRelatedConfig,
    },
    coerceEmptyString: jest.fn(),
    connection,
    escape: jest.fn(),
    escapeId: jest.fn(),
    monitoring: jest.fn(),
    MySQL,
    shapeEvent: jest.fn(),
    database: 'database',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsTableName: 'secrets-table-name',
  }
  specific = {
    MySQL,
    escape,
    escapeId,
  }
  mConnect.mockClear()
})

test('MySQL client configured', async () => {
  await mConnect(pool, specific)

  expect(mConnect).toHaveBeenCalledWith(pool, specific)
})

test('MySQL client configured (no secrets database in config)', async () => {
  pool = {
    ...pool,
    config: {
      database: 'database',
      eventsTableName: 'table-name',
      secretsTableName: 'secrets-table-name',
      ...mysqlRelatedConfig,
    },
  }

  await mConnect(pool, specific)
  expect(mConnect).toHaveBeenCalledWith(pool, specific)
})

test('connect eventstore called', async () => {
  await mConnect(pool, specific)
  expect(mConnect).toHaveBeenCalledWith(pool, specific)
})

test("MySQL config assigned to adapter's pool", async () => {
  await mConnect(pool, specific)

  expect(pool).toEqual(expect.objectContaining(pool))
})
