import sqlite from 'sqlite'
import { AdapterPool, AdapterSpecific } from '../src/types'
import connect from '../src/connect'

jest.mock('../src/get-log')

let pool: AdapterPool
let specific: AdapterSpecific

beforeEach(() => {
  pool = {
    config: {
      databaseFile: 'database-file',
      secretsTableName: 'secrets-table',
      eventsTableName: 'events-table-name',
      snapshotsTableName: 'snapshots-table-name',
    },
    coerceEmptyString: ((e: any) => e) as any,
    shapeEvent: ((e: any) => e) as any,
  } as any
  specific = {
    sqlite,
    tmp: jest.fn(),
    os: jest.fn(),
    fs: jest.fn(),
  }
})

test("config assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool.secretsTableName).toEqual('secrets-table')
})

test('eventstore connected', async () => {
  const _connect = jest.fn().mockImplementation(connect)
  await _connect(pool, specific)

  expect(_connect).toHaveBeenCalledWith(pool, specific)
})
