/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg'
import { mocked } from 'ts-jest/utils'
/* eslint-disable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types'
import connect from '../src/connect'
import executeStatement from '../src/execute-statement'

const mPostgres = mocked(Postgres)

let pool: AdapterPool
let specific: AdapterSpecific

beforeEach(() => {
  pool = {
    config: {
      user: 'user',
      database: 'database',
      port: 1234,
      host: 'host',
      password: 'password',
      databaseName: 'database-name',
      eventsTableName: 'events-table-name',
      snapshotsTableName: 'snapshots-table-name',
      secretsTableName: 'secrets-table-name',
    },
    coerceEmptyString: (obj: any, fallback?: string) => obj,
  } as any
  specific = {
    Postgres,
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
  }
  mPostgres.mockClear()
})

test('credentials passed to postgres client', async () => {
  specific.executeStatement = executeStatement

  await connect(pool, specific)

  expect(mPostgres).toHaveBeenCalledWith(
    expect.objectContaining({
      connectionTimeoutMillis: 45000,
      database: 'database',
      host: 'host',
      idle_in_transaction_session_timeout: 45000,
      keepAlive: false,
      password: 'password',
      port: 1234,
      query_timeout: 45000,
      statement_timeout: 45000,
      user: 'user',
    })
  )
})

test("utilities were assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: specific.fullJitter,
      coercer: specific.coercer,
      escape: specific.escape,
      escapeId: specific.escapeId,
    })
  )
})

test("Postgres client assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool.Postgres).toBe(Postgres)
})

test("executeStatement bound to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool.executeStatement).toBeDefined()
  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(specific.executeStatement).toHaveBeenCalledWith(pool, 'test')
  }
})
