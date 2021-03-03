import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'

jest.mock('../src/get-log')
let pool: AdapterPool

beforeEach(() => {
  pool = {
    databaseFile: 'database-file',
    secretsTableName: 'secrets-table',
    eventsTableName: 'table-name',
    snapshotsTableName: 'snapshots-table-name',
    database: { exec: jest.fn().mockImplementation((e: any) => e) },
    escapeId: (e: any) => `ESCAPEID[${e}]`,
    memoryStore: {
      name: '',
      drop: jest.fn(),
    },
    maybeThrowResourceError: jest.fn((e: Error[]) => e),
  } as any
})

test('executed statements', async () => {
  await dropEvents(pool)

  expect(pool.database.exec).toHaveBeenCalledWith(
    expect.stringMatching(/table-name-incremental-import/g)
  )
})
