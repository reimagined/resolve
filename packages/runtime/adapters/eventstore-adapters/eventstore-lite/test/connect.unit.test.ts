import BetterSqlite from 'better-sqlite3'
import {
  AdapterPool,
  ConnectionDependencies,
  SqliteAdapterConfig,
} from '../src/types'
import connect from '../src/connect'
import fs from 'fs'

jest.mock('../src/get-log')

let pool: AdapterPool
let connectionDependencies: ConnectionDependencies
let config: SqliteAdapterConfig

beforeEach(() => {
  pool = {
    shapeEvent: ((e: any) => e) as any,
  } as any
  connectionDependencies = {
    BetterSqlite,
    tmp: jest.fn(),
    os: jest.fn(),
    fs: jest.fn(),
  }
  config = {
    databaseFile: 'database-file',
    secretsTableName: 'secrets-table',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
  }
})

test("config assigned to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool.databaseFile).toEqual('database-file')
  expect(pool.secretsTableName).toEqual('secrets-table')

  if (fs.existsSync('database-file')) {
    fs.unlinkSync('database-file')
  }
})

test('connect should throw on wrong parameters', async () => {
  await expect(
    connect(pool, connectionDependencies, ({
      databaseFile: 42,
    } as any) as SqliteAdapterConfig)
  ).rejects.toThrow()

  await expect(
    connect(pool, connectionDependencies, {
      databaseFile: '',
    })
  ).rejects.toThrow()
})
