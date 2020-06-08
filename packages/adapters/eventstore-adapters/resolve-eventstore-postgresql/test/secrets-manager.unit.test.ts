import { Client as Postgres } from 'pg'
import { mocked } from 'ts-jest/utils'

import { AdapterPool } from '../src/types'
import getSecretsManager from '../src/secrets-manager'

const mPostgres = mocked(Postgres)
const mExecuteStatement = jest.fn()

let pool: AdapterPool

beforeEach(() => {
  pool = {
    user: 'user',
    database: 'database',
    port: 'port',
    host: 'host',
    password: 'password',
    databaseName: 'database-name',
    tableName: 'table-name',
    secretsTableName: 'secrets-table-name',
    Postgres,
    coercer: jest.fn(),
    escape: jest.fn().mockImplementation(v => `"${v}"`),
    escapeId: jest.fn().mockImplementation(v => `"${v}-id"`),
    executeStatement: mExecuteStatement,
    fullJitter: jest.fn()
  }
})

afterEach(() => {
  mPostgres.mockClear()
  mExecuteStatement.mockClear()
})

test('secrets manager is created', async () => {
  const manager = getSecretsManager(pool)
  expect(manager).toStrictEqual({
    getSecret: expect.any(Function),
    setSecret: expect.any(Function),
    deleteSecret: expect.any(Function)
  })
})

describe('get secret', () => {
  test('reading secret', async () => {
    const manager = getSecretsManager(pool)
    const { getSecret } = manager
    mExecuteStatement.mockReturnValueOnce([{ secret: 'secret-value' }])
    const secret = await getSecret('secret-selector')
    expect(mExecuteStatement.mock.calls).toMatchSnapshot(
      'reading secret, secret exists'
    )
    expect(secret).toBe('secret-value')
  })

  test('reading secret if no secret exists', async () => {
    mExecuteStatement.mockReturnValueOnce(null)
    const manager = getSecretsManager(pool)
    const { getSecret } = manager

    const secret = await getSecret('secret-selector')
    expect(secret).toBe(null)
  })
})

describe('delete secret', () => {
  test('secret deleted', async () => {
    const manager = getSecretsManager(pool)
    const { deleteSecret } = manager

    await deleteSecret('secret-selector')
    expect(mExecuteStatement.mock.calls).toMatchSnapshot('secret removal')
  })
})

describe('set secret', () => {
  test('secret is set', async () => {
    const manager = getSecretsManager(pool)
    const { setSecret } = manager

    await setSecret('secret-selector', 'secret-value')
    expect(mExecuteStatement.mock.calls).toMatchSnapshot('setting secret')
  })
  test('error on setting secret', async done => {
    const manager = getSecretsManager(pool)
    const { setSecret } = manager

    mExecuteStatement.mockRejectedValueOnce(new Error('set-key-error'))
    try {
      await setSecret('secret-selector', 'secret-value')
    } catch (error) {
      expect(mExecuteStatement).toBeCalledTimes(1)
      expect(mExecuteStatement.mock.calls).toMatchSnapshot(
        'error on setting secret'
      )
      done()
    }
  })
})
