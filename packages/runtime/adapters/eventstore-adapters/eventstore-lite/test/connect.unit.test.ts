import { AdapterPool, SqliteAdapterConfig } from '../src/types'
import configure from '../src/configure'

jest.mock('../src/get-log')

let pool: AdapterPool
let config: SqliteAdapterConfig

beforeEach(() => {
  pool = {
    shapeEvent: ((e: any) => e) as any,
  } as any
  config = {
    databaseFile: 'database-file',
    secretsTableName: 'secrets-table',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
  }
})

test("config assigned to adapter's pool", async () => {
  configure(pool, config)

  expect(pool.databaseFile).toEqual('database-file')
  expect(pool.secretsTableName).toEqual('secrets-table')
})

test('configure should throw on wrong parameters', async () => {
  expect(() =>
    configure(pool, ({
      databaseFile: 42,
    } as any) as SqliteAdapterConfig)
  ).toThrow()

  expect(() =>
    configure(pool, {
      databaseFile: '',
    })
  ).toThrow()
})
