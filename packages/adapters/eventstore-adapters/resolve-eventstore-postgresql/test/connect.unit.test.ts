/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg';
import { mocked } from 'ts-jest/utils';
/* eslint-disable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types';
import connect from '../src/connect';
import executeStatement from '../src/js/execute-statement';

const mPostgres = mocked(Postgres);

let pool: AdapterPool;
let specific: AdapterSpecific;

beforeEach(() => {
  pool = {
    config: {
      user: 'user',
      database: 'database',
      port: 'port',
      host: 'host',
      password: 'password',
      databaseName: 'database-name',
      eventsTableName: 'events-table-name',
      snapshotsTableName: 'snapshots-table-name',
      secretsTableName: 'secrets-table-name',
    },
  };
  specific = {
    Postgres,
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
  };
  mPostgres.mockClear();
});

test('credentials passed to postgres client', async () => {
  specific.executeStatement = executeStatement;

  await connect(pool, specific);

  expect(mPostgres).toHaveBeenCalledWith(
    expect.objectContaining({
      connectionTimeoutMillis: 45000,
      database: 'database',
      host: 'host',
      keepAlive: false,
      password: 'password',
      port: 'port',
      user: 'user',
    })
  );
});

test("utilities were assigned to adapter's pool", async () => {
  await connect(pool, specific);

  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: specific.fullJitter,
      coercer: specific.coercer,
      escape: specific.escape,
      escapeId: specific.escapeId,
    })
  );
});

test("Postgres client assigned to adapter's pool", async () => {
  await connect(pool, specific);

  expect(pool.Postgres).toBe(Postgres);
});

test("executeStatement bound to adapter's pool", async () => {
  await connect(pool, specific);

  expect(pool.executeStatement).toBeDefined();
  if (pool.executeStatement) {
    await pool.executeStatement('test');
    expect(specific.executeStatement).toHaveBeenCalledWith(pool, 'test');
  }
});
