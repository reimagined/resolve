/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
/* eslint-enable import/no-extraneous-dependencies */

import { AdapterPool } from '../src/types'
import getSecretsManager from '../src/secrets-manager'

let pool: AdapterPool
const connection = {
  execute: jest.fn(),
  query: jest.fn().mockResolvedValue([[{ secret: 'secret-value' }]]),
  end: jest.fn(),
}

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
      connection,
      eventsTableName: 'table-name',
      snapshotsTableName: 'snapshots-table-name',
      database: 'database',
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
  connection.query.mockClear()
  connection.execute.mockClear()
})

test('secrets manager is created', async () => {
  const manager = getSecretsManager(pool)
  expect(manager).toStrictEqual({
    getSecret: expect.any(Function),
    setSecret: expect.any(Function),
    deleteSecret: expect.any(Function),
  })
})

describe('get secret', () => {
  test('reading secret', async () => {
    const manager = getSecretsManager(pool)
    const { getSecret } = manager

    const secret = await getSecret('secret-selector')
    expect(connection.query.mock.calls).toMatchSnapshot(
      'reading secret, secret exists'
    )
    expect(secret).toBe('secret-value')
  })

  test('reading secret if no secret exists', async () => {
    connection.query.mockReturnValueOnce([])
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
    expect(connection.execute.mock.calls).toMatchSnapshot('secret removal')
  })
})

describe('set secret', () => {
  test('secret is set', async () => {
    const manager = getSecretsManager(pool)
    const { setSecret } = manager

    await setSecret('secret-selector', 'secret-value')
    expect(connection.query.mock.calls).toMatchSnapshot('setting secret')
  })

  test('error on setting secret', async (done) => {
    const manager = getSecretsManager(pool)
    const { setSecret } = manager

    connection.query.mockRejectedValueOnce(new Error('set-key-error'))
    try {
      await setSecret('secret-selector', 'secret-value')
    } catch (error) {
      expect(connection.query).toBeCalledTimes(2)
      expect(connection.query.mock.calls).toMatchSnapshot(
        'error on setting secret'
      )
      done()
    }
  })
})
