/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg'
import { mocked } from 'ts-jest/utils'
/* eslint-disable import/no-extraneous-dependencies */
import type {
  AdapterPool,
  ConnectionDependencies,
  PostgresqlAdapterConfig,
} from '../src/types'
import connect from '../src/connect'
import executeStatement from '../src/execute-statement'
import { DEFAULT_QUERY_TIMEOUT } from '../src/constants'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'

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
      connectionTimeoutMillis: expect.any(Number),
      database: 'database',
      host: 'host',
      idle_in_transaction_session_timeout: expect.any(Number),
      keepAlive: false,
      password: 'password',
      port: 1234,
      query_timeout: expect.any(Number),
      statement_timeout: expect.any(Number),
      user: 'user',
    })
  )

  const pConfig = mPostgres.mock.calls[0][0]
  expect(pConfig).toBeDefined()
  expect(typeof pConfig !== 'string').toBe(true)
  const definedConfig = pConfig as Exclude<typeof pConfig, string | undefined>

  expect(definedConfig.query_timeout).toEqual(DEFAULT_QUERY_TIMEOUT)
  expect(definedConfig.connectionTimeoutMillis).toBeGreaterThan(0)
  expect(definedConfig.idle_in_transaction_session_timeout).toBeGreaterThan(0)
  expect(definedConfig.statement_timeout).toBeGreaterThan(0)
})

test('getVacantTimeInMillis affects the values passed to postgres connection', async () => {
  connectionDependencies.executeStatement = executeStatement

  pool.getVacantTimeInMillis = () => 10000
  await connect(pool, connectionDependencies, {
    ...config,
  })

  const pConfig = mPostgres.mock.calls[1][0]
  const definedConfig = pConfig as Exclude<typeof pConfig, string | undefined>

  expect(definedConfig.query_timeout).toEqual(10000)
})

test('should throw RequestTimeoutError if getVacantTimeInMillis returns negative number', async () => {
  connectionDependencies.executeStatement = executeStatement

  pool.getVacantTimeInMillis = () => -1
  await expect(connect(pool, connectionDependencies, config)).rejects.toThrow(
    RequestTimeoutError
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
