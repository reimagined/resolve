/* eslint-disable import/no-extraneous-dependencies */
import sqlite from 'sqlite';
import { mocked } from 'ts-jest/utils';
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types';
import connect from '../src/connect';
import connectEventStore from '../src/js/connect';

jest.mock('../src/js/get-log');
jest.mock('../src/js/connect', () => jest.fn());

let pool: AdapterPool;
let specific: AdapterSpecific;

const mConnectEventStore = mocked(connectEventStore);
const mSqlite = mocked(sqlite);

beforeEach(() => {
  pool = {
    config: {
      databaseFile: 'database-file',
      secretsFile: 'secret-file',
      secretsTableName: 'secrets-table',
      eventsTableName: 'events-table-name',
      snapshotsTableName: 'snapshots-table-name',
    },
    secretsDatabase: '',
    secretsTableName: '',
    database: '',
    eventsTableName: '',
    snapshotsTableName: '',
    escape: jest.fn(),
    escapeId: jest.fn(),
    memoryStore: 'memory',
  };
  specific = {
    sqlite,
    tmp: jest.fn(),
    os: jest.fn(),
    fs: jest.fn(),
  };
});

test("config assigned to adapter's pool", async () => {
  await connect(pool, specific);

  expect(pool).toEqual(
    expect.objectContaining({
      secretsTableName: 'secrets-table',
    })
  );

  expect(pool.secretsDatabase).toEqual(
    expect.objectContaining({
      exec: expect.any(Function),
    })
  );
});

test('secrets store connected', async () => {
  await connect(pool, specific);

  expect(mSqlite.open).toHaveBeenCalledWith(pool.config.secretsFile);
});

test('eventstore connected', async () => {
  await connect(pool, specific);

  expect(mConnectEventStore).toHaveBeenCalledWith(pool, specific);
});
