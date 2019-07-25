import { result as mockResult } from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from '../src/index'
import createResource from '../src/resource/create'
import disposeResource from '../src/resource/dispose'
import destroyResource from '../src/resource/destroy'

describe('resource', () => {
  afterEach(() => {
    mockResult.length = 0
  })

  test('method "create" should create resource', async () => {
    const createAdapter = jest
      .fn()
      .mockImplementation((...args) => _createAdapter(...args))
    const pool = {
      createAdapter
    }

    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin',
      userPassword: 'userPassword'
    }

    await createResource(pool, options)

    expect(createAdapter).toHaveBeenCalledWith({
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: 'mysql',
      resourceOptions: {
        databaseName: options.databaseName,
        tableName: options.tableName,
        userLogin: options.userLogin,
        userPassword: options.userPassword
      },
      skipInit: true
    })

    expect(mockResult).toMatchSnapshot()
  })

  test('method "destroy" should destroy resource', async () => {
    const createAdapter = jest
      .fn()
      .mockImplementation((...args) => _createAdapter(...args))
    const pool = {
      createAdapter
    }

    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      userLogin: 'userLogin'
    }

    await destroyResource(pool, options)

    expect(createAdapter).toHaveBeenCalledWith({
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: 'mysql',
      resourceOptions: {
        databaseName: options.databaseName,
        userLogin: options.userLogin
      },
      skipInit: true
    })

    expect(mockResult).toMatchSnapshot()
  })

  test('method "dispose" should dispose resource', async () => {
    const createAdapter = jest
      .fn()
      .mockImplementation((...args) => _createAdapter(...args))
    const pool = {
      createAdapter
    }

    Object.assign(pool, {
      createResource: createResource.bind(null, pool),
      destroyResource: destroyResource.bind(null, pool)
    })

    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin',
      userPassword: 'userPassword'
    }

    await disposeResource(pool, options)

    expect(createAdapter).toHaveBeenCalledWith({
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: 'mysql',
      resourceOptions: {
        databaseName: options.databaseName,
        tableName: options.tableName,
        userLogin: options.userLogin,
        userPassword: options.userPassword
      },
      skipInit: true
    })

    expect(createAdapter).toHaveBeenCalledWith({
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: 'mysql',
      resourceOptions: {
        databaseName: options.databaseName,
        userLogin: options.userLogin
      },
      skipInit: true
    })

    expect(mockResult).toMatchSnapshot()
  })
})
