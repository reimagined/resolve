/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types'
import connect from '../src/connect'
import connectEventStore from '../src/js/connect'

jest.mock('../src/js/get-log')
jest.mock('../src/js/connect', () => jest.fn())

let mysqlRelatedConfig: any
let pool: AdapterPool
let specific: AdapterSpecific

const mCreateConnection = mocked(MySQL.createConnection)

beforeEach(() => {
  mysqlRelatedConfig = {
    mysqlRelatedOption: 'mysql-option'
  }
  pool = {
    config: {
      database: 'database',
      tableName: 'table-name',
      secretsDatabase: 'secrets-database',
      secretsTableName: 'secrets-table-name',
      ...mysqlRelatedConfig
    },
    events: {
      connection: MySQL.connection,
      tableName: '',
      database: ''
    },
    secrets: {
      connection: MySQL.connection,
      tableName: '',
      database: ''
    },
    escape: jest.fn(),
    escapeId: jest.fn(),
    MySQL
  }
  specific = {
    MySQL,
    escape,
    escapeId
  }
  mCreateConnection.mockClear()
})

test('MySQL client configured', async () => {
  await connect(pool, specific)

  expect(mCreateConnection).toHaveBeenCalledWith({
    ...mysqlRelatedConfig,
    database: 'secrets-database',
    multipleStatements: true,
    tableName: 'table-name'
  })
})

test('MySQL client configured (no secrets database in config)', async () => {
  pool = {
    ...pool,
    config: {
      database: 'database',
      tableName: 'table-name',
      secretsTableName: 'secrets-table-name',
      ...mysqlRelatedConfig
    }
  }

  await connect(pool, specific)
  expect(mCreateConnection).toHaveBeenCalledWith({
    ...mysqlRelatedConfig,
    database: 'database',
    multipleStatements: true,
    tableName: 'table-name'
  })
})

test('connect eventstore called', async () => {
  await connect(pool, specific)
  expect(connectEventStore).toHaveBeenCalledWith(pool, specific)
})

test("MySQL config assigned to adapter's pool", async () => {
  const mEscape = jest.fn()
  const mEscapeId = jest.fn()

  specific = {
    ...specific,
    escape: mEscape,
    escapeId: mEscapeId
  }
  await connect(pool, specific)

  expect(pool.secrets).toEqual(
    expect.objectContaining({
      connection: expect.any(Object),
      tableName: 'secrets-table-name',
      database: 'secrets-database'
    })
  )

  expect(pool).toEqual(
    expect.objectContaining({
      escape: mEscape,
      escapeId: mEscapeId
    })
  )
})
