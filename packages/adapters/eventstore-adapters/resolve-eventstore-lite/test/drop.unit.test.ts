import { AdapterPool } from '../src/types'
import drop from '../src/drop'

jest.mock('../src/get-log')
let pool: AdapterPool

const mDrop = jest.fn(drop)

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
    monitoring: jest.fn((e: Error[]) => e),
  } as any
})

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith(pool)
})

test('secrets store dropped', async () => {
  await mDrop(pool)

  expect(pool.database.exec.mock.calls).toMatchSnapshot('drop table with keys')
})
