import { AdapterPool } from '../src/types'
import drop from '../src/drop'

jest.mock('../src/get-log')
const mDrop = jest.fn(drop)

const connection = {
  execute: jest.fn((sql: string) => Promise.resolve(sql)),
  query: jest.fn(),
  end: jest.fn(),
}

let pool: AdapterPool

beforeEach(() => {
  pool = {
    config: {
      database: 'database',
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
      secretsDatabase: 'secrets-database',
      secretsTableName: 'secrets-table-name',
    },
    connection: {
      execute: jest.fn((sql: string) => Promise.resolve(sql)),
      query: jest.fn((sql: any) => Promise.resolve(sql)),
      end: jest.fn(() => Promise.resolve()),
    },
    escape: jest.fn((v: any) => `"${v}-escaped"`),
    escapeId: jest.fn((v: any) => `"${v}-escaped-id"`),
    MySQL: {
      // eslint-disable-next-line @typescript-eslint/camelcase,spellcheck/spell-checker
      createconnection: jest.fn((options: any) => connection),
    },
    maybeThrowResourceError: jest.fn((e: Error[]) => e)
  } as any
})

afterEach(() => {
  mDrop.mockClear()
  connection.execute.mockClear()
})

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith(pool)
})

test('secrets store dropped', async () => {
  await mDrop(pool)

  expect(connection.execute.mock.calls).toMatchSnapshot('drop table with keys')
})
