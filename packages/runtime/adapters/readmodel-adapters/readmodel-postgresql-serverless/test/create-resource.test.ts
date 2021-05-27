import create from '../src/resource/create'
import { AdminPool, AdminOptions } from '../src/types'

describe('resource: create', () => {
  test('should execute sql including "XaValue" VARCHAR(65535)', async () => {
    const inlineLedgerExecuteStatement = jest.fn()
    const connect = jest.fn().mockImplementation((admin) => {
      admin.inlineLedgerExecuteStatement = inlineLedgerExecuteStatement
    })
    const disconnect = jest.fn()
    const escapeId = (str: string) => str

    const pool = ({
      connect,
      disconnect,
      escapeId,
    } as unknown) as AdminPool

    const options: AdminOptions = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      region: 'region',
      userLogin: 'userLogin',
    }

    await create(pool, options)

    expect(inlineLedgerExecuteStatement.mock.calls.join(' ')).toContain(
      '"XaValue" VARCHAR(65535)'
    )
  })
})
