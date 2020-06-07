/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils'
/* eslint-disable import/no-extraneous-dependencies */
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import { AdapterPool } from '../src/types'
import drop from '../src/drop'
import dropEventStore from '../src/js/drop'

jest.mock('../src/js/get-log')
jest.mock('../src/js/drop', () => jest.fn())

const mDropEventStore = mocked(dropEventStore)

let pool: AdapterPool

beforeEach(() => {
  pool = {
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
    secretsTableName: 'secrets-table-name',
    databaseName: 'database',
    executeStatement: jest.fn(),
    escapeId: jest.fn(v => `escaped-${v}`)
  }
})

afterEach(() => {
  mDropEventStore.mockClear()
})

test('event store dropped', async () => {
  await drop(pool)

  expect(mDropEventStore).toHaveBeenCalledWith({
    databaseName: 'database',
    eventsTableName: 'events-table-name',
    snapshotsTableName: 'snapshots-table-name',
    executeStatement: pool.executeStatement,
    escapeId: pool.escapeId
  })
})

test('error: secretsTableName is missing within pool', async () => {
  await expect(
    drop({
      ...pool,
      secretsTableName: undefined
    })
  ).rejects.toBeInstanceOf(Error)
})

test('error: escapeId is missing within pool', async () => {
  await expect(
    drop({
      ...pool,
      escapeId: undefined
    })
  ).rejects.toBeInstanceOf(Error)
})

test('error: databaseName is missing within pool', async () => {
  await expect(
    drop({
      ...pool,
      databaseName: undefined
    })
  ).rejects.toBeInstanceOf(Error)
})

test('error: executeStatement is missing within pool', async () => {
  await expect(
    drop({
      ...pool,
      executeStatement: undefined
    })
  ).rejects.toBeInstanceOf(Error)
})

test('secrets table dropped', async () => {
  await drop(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    `DROP TABLE escaped-database.escaped-secrets-table-name`
  )
})

test('secrets stream index dropped', async () => {
  await drop(pool)

  expect(pool.executeStatement).toHaveBeenCalledWith(
    `DROP INDEX IF EXISTS escaped-database.escaped-secrets-table-name-global`
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
