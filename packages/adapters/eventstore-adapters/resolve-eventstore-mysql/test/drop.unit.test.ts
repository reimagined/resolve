/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */

import { AdapterPool } from '../src/types'
import drop from '../src/drop'
import dropEventStore from '../src/js/drop'

jest.mock('../src/js/get-log')
jest.mock('../src/js/drop', () => jest.fn())

const mDropEventStore = mocked(dropEventStore)
const connection = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}

let pool: AdapterPool

beforeEach(() => {
  pool = {
    config: {
      database: 'database',
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
      secretsDatabase: 'secrets-database',
      secretsTableName: 'secrets-table-name',
    },
    events: {
      connection: MySQL.connection,
      eventsTableName: '',
      snapshotsTableName: '',
      database: '',
    },
    secrets: {
      connection,
      tableName: 'secrets-database',
      database: 'secrets-table-name',
    },
    escape: jest.fn((v: any) => `"${v}-escaped"`),
    escapeId: jest.fn((v: any) => `"${v}-escaped-id"`),
    MySQL,
  }
})

afterEach(() => {
  mDropEventStore.mockClear()
  connection.execute.mockClear()
})

test('event store dropped', async () => {
  await drop(pool)

  expect(mDropEventStore).toHaveBeenCalledWith(pool)
})

test('secrets store dropped', async () => {
  await drop(pool)

  expect(connection.execute.mock.calls).toMatchSnapshot('drop table with keys')
})
