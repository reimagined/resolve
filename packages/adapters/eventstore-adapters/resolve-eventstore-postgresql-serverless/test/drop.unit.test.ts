/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool } from '../src/types'
import drop from '../src/drop'

jest.mock('get-log')

const mDrop = jest.fn(drop)

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
  await drop(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    `DROP TABLE escaped-database.escaped-secrets-table`
  )
})

test('secrets stream index dropped', async () => {
  await drop(pool)

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

  await expect(drop(pool)).rejects.toBeInstanceOf(
    EventstoreResourceNotExistError
  )
})
