import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import createSnapshotAdapter from '../src/index'
import { create, dispose, destroy } from '../src/index'

describe('resolve-snapshot-postgres-serverless', () => {
  const bucketSize = 5
  let snapshotAdapter = null

  beforeEach(async () => {
    snapshotAdapter = createSnapshotAdapter({
      awsSecretStoreArn: 'awsSecretStoreArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      region: 'region',
      bucketSize
    })

    RDSDataService.prototype.beginTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({ transactionId: 'transactionId' }) }
    })
    RDSDataService.prototype.commitTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({}) }
    })
    RDSDataService.prototype.rollbackTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({}) }
    })
    RDSDataService.prototype.executeStatement.mockImplementation(() => {
      return {
        promise: () => {
          return Promise.resolve({})
        }
      }
    })
  })

  afterEach(async () => {
    RDSDataService.prototype.beginTransaction.mockReset()
    RDSDataService.prototype.commitTransaction.mockReset()
    RDSDataService.prototype.rollbackTransaction.mockReset()
    RDSDataService.prototype.executeStatement.mockReset()

    if (snapshotAdapter != null) {
      await snapshotAdapter.dispose()
    }
  })

  test(`"saveSnapshot" should save the snapshot every 5 times`, async () => {
    await snapshotAdapter.init()
    for (let index = 0; index < bucketSize; index++) {
      await snapshotAdapter.saveSnapshot('key', `value = ${index}`)
    }

    await snapshotAdapter.saveSnapshot('key', `value = ${bucketSize}`)

    expect(
      RDSDataService.prototype.beginTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.commitTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.rollbackTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()
  })

  test(`"loadSnapshot" should load the snapshot`, async () => {
    await snapshotAdapter.init()

    RDSDataService.prototype.executeStatement.mockReturnValueOnce({
      promise: () =>
        Promise.resolve({
          records: [[{ stringValue: '' }]],
          columnMetadata: [{ name: 'SnapshotContentChunk' }]
        })
    })

    const value = await snapshotAdapter.loadSnapshot('key')

    expect(
      RDSDataService.prototype.beginTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.commitTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.rollbackTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()

    expect(value).toMatchSnapshot()
  })

  test(`"drop" should drop the snapshotAdapter`, async () => {
    await snapshotAdapter.init()
    await snapshotAdapter.dropSnapshot('key')

    expect(
      RDSDataService.prototype.beginTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.commitTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.rollbackTransaction.mock.calls
    ).toMatchSnapshot()
    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()
  })

  test(`"dispose" should dispose the snapshotAdapter`, async () => {
    await snapshotAdapter.init()
    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.dispose()
      snapshotAdapter = null
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
      snapshotAdapter = null
    }
  })
})

describe('resolve-snapshot-postgres-serverless as resource', () => {
  beforeEach(async () => {
    RDSDataService.prototype.beginTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({ transactionId: 'transactionId' }) }
    })
    RDSDataService.prototype.commitTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({}) }
    })
    RDSDataService.prototype.rollbackTransaction.mockImplementation(() => {
      return { promise: Promise.resolve({}) }
    })
    RDSDataService.prototype.executeStatement.mockImplementation(() => {
      return {
        promise: () => {
          return Promise.resolve({})
        }
      }
    })
  })

  afterEach(async () => {
    RDSDataService.prototype.beginTransaction.mockReset()
    RDSDataService.prototype.commitTransaction.mockReset()
    RDSDataService.prototype.rollbackTransaction.mockReset()
    RDSDataService.prototype.executeStatement.mockReset()
  })

  test('method "create" should create resource', async () => {
    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin',
      userPassword: 'userPassword',
      region: 'region'
    }

    await create(options)

    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()
  })

  test('method "destroy" should destroy resource', async () => {
    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin',
      region: 'region'
    }

    await destroy(options)

    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()
  })

  test('method "dispose" should dispose resource', async () => {
    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin',
      userPassword: 'userPassword',
      region: 'region'
    }

    await dispose(options)

    expect(
      RDSDataService.prototype.executeStatement.mock.calls
    ).toMatchSnapshot()
  })
})
