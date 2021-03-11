import sqlite from 'sqlite'
import {
  AdapterPool,
  ConnectionDependencies,
  SqliteAdapterConfig,
} from '../src/types'
import connect from '../src/connect'

jest.mock('../src/get-log')

let pool: AdapterPool
let connectionDependencies: ConnectionDependencies
let config: SqliteAdapterConfig

beforeEach(() => {
  pool = {
    shapeEvent: ((e: any) => e) as any,
  } as any
  connectionDependencies = {
    sqlite,
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
})

test('connect should throw on wrong parameters', async () => {
  await expect(
    connect(pool, connectionDependencies, ({
      databaseFile: 42,
    } as any) as SqliteAdapterConfig)
  ).rejects.toThrow()
})
