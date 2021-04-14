import createReadModelAdapter from '../src'

describe('@resolve-js/replicator-postgresql-serverless', () => {
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let adapter = null! as ReturnType<typeof createReadModelAdapter>

  beforeEach(() => {
    adapter = createReadModelAdapter({
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      awsSecretStoreArn: 'awsSecretStoreArn',
      databaseName: 'databaseName',
      targetEventStore: {
        dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
        awsSecretStoreArn: 'awsSecretStoreArn',
        databaseName: 'databaseName',
      },
    })
  })

  test('connect and disconnect should be successful', async () => {
    const store = await adapter.connect('replicator')
    await adapter.disconnect(store)
  })
})
