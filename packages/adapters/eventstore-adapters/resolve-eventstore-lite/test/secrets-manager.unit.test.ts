import { AdapterPool } from '../src/types';

import getSecretsManager from '../src/secrets-manager';
const mExec = jest.fn();
const mGet = jest.fn().mockReturnValue({ secret: 'secret-value' });

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
    secretsDatabase: { exec: mExec, get: mGet },
    secretsTableName: 'secrets-table',
    database: '',
    eventsTableName: '',
    snapshotsTableName: '',
    escape: jest.fn((v: any) => `"${v}-escaped"`),
    escapeId: jest.fn((v: any) => `"${v}-escaped-id"`),
    memoryStore: 'memory',
  };
});

afterEach(() => {
  mExec.mockClear();
  mGet.mockClear();
});

test('secrets manager is created', async () => {
  const manager = getSecretsManager(pool);
  expect(manager).toStrictEqual({
    getSecret: expect.any(Function),
    setSecret: expect.any(Function),
    deleteSecret: expect.any(Function),
  });
});

describe('get secret', () => {
  test('reading secret', async () => {
    const manager = getSecretsManager(pool);
    const { getSecret } = manager;

    const secret = await getSecret('secret-selector');
    expect(mGet.mock.calls).toMatchSnapshot('reading secret, secret exists');
    expect(secret).toBe('secret-value');
  });

  test('reading secret if no secret exists', async () => {
    mGet.mockReturnValueOnce(null);
    const manager = getSecretsManager(pool);
    const { getSecret } = manager;

    const secret = await getSecret('secret-selector');
    expect(secret).toBe(null);
  });
});

describe('delete secret', () => {
  test('secret deleted', async () => {
    const manager = getSecretsManager(pool);
    const { deleteSecret } = manager;

    await deleteSecret('secret-selector');
    expect(mExec.mock.calls).toMatchSnapshot('secret removal');
  });
});

describe('set secret', () => {
  test('secret is set', async () => {
    const manager = getSecretsManager(pool);
    const { setSecret } = manager;

    await setSecret('secret-selector', 'secret-value');
    expect(mExec.mock.calls).toMatchSnapshot('setting secret');
  });

  test('error on setting secret', async (done) => {
    const manager = getSecretsManager(pool);
    const { setSecret } = manager;

    mExec.mockRejectedValueOnce(new Error('set-key-error'));
    try {
      await setSecret('secret-selector', 'secret-value');
    } catch (error) {
      expect(mExec).toBeCalledTimes(2);
      expect(mExec.mock.calls).toMatchSnapshot('error on setting secret');
      done();
    }
  });
});
