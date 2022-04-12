/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg'
import { mocked } from 'jest-mock'
/* eslint-disable import/no-extraneous-dependencies */
import type { AdapterPool, PostgresqlAdapterConfig } from '../src/types'
import connect from '../src/connect'
import configure from '../src/configure'
import { DEFAULT_QUERY_TIMEOUT } from '../src/constants'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'

const mPostgres = mocked(Postgres)
Object.assign(mPostgres.prototype, {
  on: (event: 'error', listener: (err: Error) => void) => {
    return mPostgres
  },
})

let pool: AdapterPool
let config: PostgresqlAdapterConfig

beforeEach(() => {
  pool = {
    Postgres,
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
  } as any
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
  configure(pool, config)
  await connect(pool)

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
  pool.getVacantTimeInMillis = () => 10000
  configure(pool, config)
  await connect(pool)

  const pConfig = mPostgres.mock.calls[1][0]
  const definedConfig = pConfig as Exclude<typeof pConfig, string | undefined>

  expect(definedConfig.query_timeout).toEqual(10000)
})

test('should throw RequestTimeoutError if getVacantTimeInMillis returns negative number', async () => {
  pool.getVacantTimeInMillis = () => -1
  await expect(connect(pool)).rejects.toThrow(RequestTimeoutError)
})
