import { result as mockResult } from 'aws-sdk/clients/rdsdataservice'
import RDSDataService from 'aws-sdk/clients/rdsdataservice'

import connect from '../src/connect'
import init from '../src/init'
import dispose from '../src/dispose'
import fullJitter from '../src/full-jitter'
import executeStatement from '../src/execute-statement'
import coercer from '../src/coercer'
import escapeId from '../src/escape-id'
import escape from '../src/escape'

import createResource from '../src/resource/create'
import disposeResource from '../src/resource/dispose'
import destroyResource from '../src/resource/destroy'

describe('resource', () => {
  afterEach(() => {
    mockResult.length = 0
  })

  test('method "create" should create resource', async () => {
    const pool = {
      executeStatement,
      connect,
      init,
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      coercer,
      dispose
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

    expect(mockResult).toMatchSnapshot()
  })

  test('method "destroy" should destroy resource', async () => {
    const pool = {
      executeStatement,
      connect,
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      coercer,
      dispose
    }

    const options = {
      awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'databaseName',
      tableName: 'tableName',
      userLogin: 'userLogin'
    }

    await destroyResource(pool, options)

    expect(mockResult).toMatchSnapshot()
  })

  test('method "dispose" should dispose resource', async () => {
    const pool = {
      executeStatement,
      connect,
      init,
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      coercer,
      dispose
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

    expect(mockResult).toMatchSnapshot()
  })
})
