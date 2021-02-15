import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'
import { mocked } from 'ts-jest/utils'

jest.mock('../src/get-log')
const mDropEvents = jest.fn(dropEvents)
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
    maybeThrowResourceError: jest.fn((e: Error[]) => e),
  } as any
})

afterEach(() => {
  mDropEvents.mockClear()
  const execute = mocked(pool.connection.execute)
  execute.mockClear()
})

test('event store dropped', async () => {
  await mDropEvents(pool)

  expect(mDropEvents).toHaveBeenCalledWith(pool)
})

test('executed statements', async () => {
  await mDropEvents(pool)
  const execute = mocked(pool.connection.execute)

  expect(execute).toHaveBeenCalledWith(
    expect.stringMatching(/table-name-incremental-import/g)
  )
})
