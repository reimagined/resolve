import { AdapterPool } from '../src/types'
import drop from '../src/drop'
import { mocked } from 'ts-jest/utils'

jest.mock('../src/get-log')
const mDrop = jest.fn(drop)
let pool: AdapterPool

beforeEach(() => {
  pool = {
    database: 'database',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsDatabase: 'secrets-database',
    secretsTableName: 'secrets-table-name',
    connection: {
      execute: jest
        .fn()
        .mockImplementation((sql: string) => Promise.resolve(sql)),
      query: jest.fn().mockImplementation((sql: any) => Promise.resolve(sql)),
      end: jest.fn().mockImplementation(() => Promise.resolve()),
    },
    escapeId: (e: any) => `ESCAPEID[${e}]`,
    monitoring: jest.fn((e: Error[]) => e),
  } as any
})

afterEach(() => {
  mDrop.mockClear()
  const execute = mocked(pool.connection.execute)
  execute.mockClear()
})

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith(pool)
})

test('secrets store dropped', async () => {
  await mDrop(pool)
  const execute = mocked(pool.connection.execute)
  expect(execute.mock.calls).toMatchSnapshot('drop table with keys')
})
