/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils'
/* eslint-disable import/no-extraneous-dependencies */
import { EventstoreResourceNotExistError } from '@reimagined/eventstore-base'
import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'

jest.mock('../src/get-log')

const mDrop = jest.fn(dropEvents)

let pool: AdapterPool

beforeEach(() => {
  pool = {
    databaseName: 'data-base-name',
    secretsTableName: 'secrets-table-name',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
    executeStatement: jest.fn((sql: any) => Promise.resolve(sql)),
    escapeId: (e: any) => e,
    maybeThrowResourceError: jest.fn((e: Error[]) => e),
  } as any
})

afterEach(() => {
  mDrop.mockClear()
})

test('event store dropped', async () => {
  await mDrop(pool)

  expect(mDrop).toHaveBeenCalledWith({
    databaseName: 'data-base-name',
    secretsTableName: 'secrets-table-name',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
    maybeThrowResourceError: pool.maybeThrowResourceError,
    executeStatement: pool.executeStatement,
    escapeId: pool.escapeId,
  })
})

test('secrets table dropped', async () => {
  await mDrop(pool)

  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    1,
    `DROP TABLE data-base-name.events-table-name`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    2,
    `DROP INDEX IF EXISTS data-base-name.events-table-name-aggregateIdAndVersion`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    3,
    `DROP INDEX IF EXISTS data-base-name.events-table-name-aggregateId`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    4,
    `DROP INDEX IF EXISTS data-base-name.events-table-name-aggregateVersion`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    5,
    `DROP INDEX IF EXISTS data-base-name.events-table-name-type`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    6,
    `DROP INDEX IF EXISTS data-base-name.events-table-name-timestamp`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    7,
    `DROP TABLE data-base-name.events-table-name-threads`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    8,
    `DROP TABLE IF EXISTS data-base-name.events-table-name-freeze`
  )
  expect(pool.executeStatement).toHaveBeenNthCalledWith(
    9,
    `DROP TABLE data-base-name.snapshots-table-name`
  )
})

test('resource not exist error detection', async () => {
  if (pool.executeStatement) {
    const error: Error = new Error('Table.some-table does not exist')
    void ((error as any).code = '42P01')
    mocked(pool.executeStatement).mockRejectedValueOnce(error)
  }

  const errors = await mDrop(pool)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toBeInstanceOf(EventstoreResourceNotExistError)
})
