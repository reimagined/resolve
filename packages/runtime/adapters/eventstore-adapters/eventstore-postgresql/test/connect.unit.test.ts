/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg'
import { mocked } from 'ts-jest/utils'
/* eslint-disable import/no-extraneous-dependencies */
import {
  AdapterPool,
  ConnectionDependencies,
  PostgresqlAdapterConfig,
} from '../src/types'
import connect from '../src/connect'
import executeStatement from '../src/execute-statement'

const mPostgres = mocked(Postgres)
Object.assign(mPostgres.prototype, {
  on: (event: 'error', listener: (err: Error) => void) => {
    return mPostgres
  },
})

let pool: AdapterPool
let connectionDependencies: ConnectionDependencies
let config: PostgresqlAdapterConfig

beforeEach(() => {
  pool = {
    connectionErrors: [],
  } as any
  connectionDependencies = {
    Postgres,
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
  }
  config = {
    user: 'user',
    database: 'database',
    port: 1234,
    host: 'host',
    password: 'password',
    databaseName: 'database-name',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsTableName: 'secrets-table-name',
  }
})

test('destination passed to postgres client', async () => {
  connectionDependencies.executeStatement = executeStatement

  await connect(pool, connectionDependencies, config)

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
  await connect(pool, connectionDependencies, config)

  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: connectionDependencies.fullJitter,
      coercer: connectionDependencies.coercer,
      escape: connectionDependencies.escape,
      escapeId: connectionDependencies.escapeId,
    })
  )
})

test("Postgres client assigned to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool.Postgres).toBe(Postgres)
})

test("executeStatement bound to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool.executeStatement).toBeDefined()
  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(connectionDependencies.executeStatement).toHaveBeenCalledWith(
      pool,
      'test'
    )
  }
})
