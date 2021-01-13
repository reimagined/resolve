import { AdapterPool } from '../src/types'
import drop from '../src/drop'

jest.mock('../src/get-log')
let pool: AdapterPool

const mDrop = jest.fn(drop)

beforeEach(() => {
  pool = {
    config: {
      databaseFile: 'database-file',
      secretsTableName: 'secrets-table',
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
    },
    database: { exec: (e: any) => e },
    escapeId: (e: any) => e,
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

test('secrets store dropped', async () => {
  await mDrop(pool)

  expect(mDrop.mock.calls).toMatchSnapshot('drop table with keys')
})
