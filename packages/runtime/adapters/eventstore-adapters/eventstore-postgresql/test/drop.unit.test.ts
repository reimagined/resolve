/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'jest-mock'
/* eslint-disable import/no-extraneous-dependencies */
import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'

jest.mock('../src/get-log')

const mDropEvents = jest.fn(dropEvents)

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
  mDropEvents.mockClear()
})

test('secrets table dropped', async () => {
  await mDropEvents(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-aggregateIdAndVersion/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-aggregateId/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-aggregateVersion/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-type/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-timestamp/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-threads/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-freeze/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/snapshots-table-name/g)
  )
  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/events-table-name-incremental-import/g)
  )
})

test('resource not exist error detection', async () => {
  if (pool.executeStatement) {
    const error: Error = new Error('Table.some-table does not exist')
    void ((error as any).code = '42P01')
    mocked(pool.executeStatement).mockRejectedValueOnce(error)
  }

  const errors = await mDropEvents(pool)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toBeInstanceOf(EventstoreResourceNotExistError)
})
