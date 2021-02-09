import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'

jest.mock('../src/get-log')
let pool: AdapterPool

const mDrop = jest.fn(dropEvents)

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

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith(pool)
})

test('executed statements', async () => {
  await mDrop(pool)

  expect(pool.database.exec.mock.calls.length).toBe(3)
})
