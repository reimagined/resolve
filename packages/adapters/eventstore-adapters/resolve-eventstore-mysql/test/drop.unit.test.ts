import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'
import { mocked } from 'ts-jest/utils'

jest.mock('../src/get-log')
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

test('executed statements', async () => {
  await dropEvents(pool)
  const execute = mocked(pool.connection.execute)

  expect(execute).toHaveBeenCalledWith(
    expect.stringMatching(/table-name-incremental-import/g)
  )
})
