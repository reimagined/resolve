/* eslint-disable import/no-extraneous-dependencies */
import { mocked } from 'ts-jest/utils';
/* eslint-enable import/no-extraneous-dependencies */

import { AdapterPool } from '../src/types';
import drop from '../src/drop';
import dropEventStore from '../src/js/drop';

jest.mock('../src/js/get-log');
jest.mock('../src/js/drop', () => jest.fn());

const mDropEventStore = mocked(dropEventStore);
const mExec = jest.fn();

let pool: AdapterPool;

beforeEach(() => {
  pool = {
    config: {
      databaseFile: 'database-file',
      secretsFile: 'secret-file',
      secretsTableName: 'secrets-table',
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
    },
    secretsDatabase: { exec: mExec },
    secretsTableName: 'secrets-table',
    database: '',
    eventsTableName: '',
    snapshotsTableName: '',
    escape: jest.fn(),
    escapeId: jest.fn((v: any) => `"${v}-escaped"`),
    memoryStore: 'memory',
  };
});

afterEach(() => {
  mDropEventStore.mockClear();
  mExec.mockClear();
});

test('event store dropped', async () => {
  await drop(pool);

  expect(mDropEventStore).toHaveBeenCalledWith(pool);
});

test('secrets store dropped', async () => {
  await drop(pool);

  expect(mExec.mock.calls).toMatchSnapshot('drop table with keys');
});
