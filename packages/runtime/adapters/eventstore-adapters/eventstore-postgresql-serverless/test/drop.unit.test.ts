/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils'
import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool } from '../src/types'
import dropEvents from '../src/drop-events'
import dropSecrets from '../src/drop-secrets'

jest.mock('get-log')

const mDrop = jest.fn(dropEvents)

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

test('secrets table dropped', async () => {
  await dropSecrets(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/escaped-secrets-table/g)
  )
})

test('secrets stream index dropped', async () => {
  await dropSecrets(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    expect.stringMatching(/escaped-secrets-table-global/g)
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
