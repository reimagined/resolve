/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'
import dropSecrets from '../src/drop-secrets'

jest.mock('get-log')

const mDrop = jest.fn(dropEvents)
const mDropSecrets = jest.fn(dropSecrets)

let pool: AdapterPool

beforeEach(() => {
  pool = {
    eventsTableName: 'events-table',
    secretsTableName: 'secrets-table',
    snapshotsTableName: 'snapshots-table',
    databaseName: 'database',
    executeStatement: jest.fn(),
    maybeThrowResourceError: jest.fn((e: Error[]) => e),
    escapeId: jest.fn((v) => `escaped-${v}`),
  } as any
})

afterEach(() => {
  mDrop.mockClear()
})

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith({
    databaseName: 'database',
    escapeId: pool.escapeId,
    eventsTableName: 'events-table',
    executeStatement: pool.executeStatement,
    maybeThrowResourceError: pool.maybeThrowResourceError,
    secretsTableName: 'secrets-table',
    snapshotsTableName: 'snapshots-table',
  })
})

test('secrets table dropped', async () => {
  await dropSecrets(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    `DROP TABLE escaped-database.escaped-secrets-table`
  )
})

test('secrets stream index dropped', async () => {
  await dropSecrets(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    `DROP INDEX IF EXISTS escaped-database.escaped-secrets-table-global`
  )
})

test('resource not exist error detection', async () => {
  if (pool.executeStatement) {
    mocked(pool.executeStatement).mockRejectedValueOnce(
      Error('Table.some-table does not exist')
    )
  }

  const errors = await dropEvents(pool)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toBeInstanceOf(EventstoreResourceNotExistError)
})
