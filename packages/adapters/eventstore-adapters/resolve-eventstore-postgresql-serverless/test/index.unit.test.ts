/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
import genericCreateAdapter from '@reimagined/eventstore-base'
/* eslint-enable import/no-extraneous-dependencies */

import loadEventsByCursor from '../src/load-events-by-cursor'
import loadEventsByTimestamp from '../src/load-events-by-timestamp'
import freeze from '../src/freeze'
import unfreeze from '../src/unfreeze'
import getLatestEvent from '../src/get-latest-event'
import saveEvent from '../src/save-event'
import fullJitter from '../src/full-jitter'
import executeStatement from '../src/execute-statement'
import injectEvent from '../src/inject-event'
import coercer from '../src/coercer'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import shapeEvent from '../src/shape-event'
import connect from '../src/connect'
import initEvents from '../src/init-events'
import initSecrets from '../src/init-secrets'
import initFinal from '../src/init-final'
import dropEvents from '../src/drop-events'
import dropSecrets from '../src/drop-secrets'
import dropFinal from '../src/drop-final'
import dispose from '../src/dispose'
import getSecret from '../src/get-secret'
import setSecret from '../src/set-secret'
import deleteSecret from '../src/delete-secret'
import loadSnapshot from '../src/load-snapshot'
import saveSnapshot from '../src/save-snapshot'
import dropSnapshot from '../src/drop-snapshot'
import beginIncrementalImport from '../src/begin-incremental-import'
import commitIncrementalImport from '../src/commit-incremental-import'
import rollbackIncrementalImport from '../src/rollback-incremental-import'
import pushIncrementalImport from '../src/push-incremental-import'
import loadSecrets from '../src/load-secrets'
import injectSecret from '../src/inject-secret'

import createResource from '../src/resource/create'
import disposeResource from '../src/resource/dispose'
import destroyResource from '../src/resource/destroy'

import createAdapter, {
  create as exportedCreate,
  destroy as exportedDestroy,
  dispose as exportedDispose,
} from '../src/index'
import {
  CloudResource,
  CloudResourceOptions,
  CloudResourcePool,
} from '../src/types'

jest.mock('../src/load-events-by-cursor', () => jest.fn())
jest.mock('../src/freeze', () => jest.fn())
jest.mock('../src/unfreeze', () => jest.fn())
jest.mock('../src/get-latest-event', () => jest.fn())
jest.mock('../src/save-event', () => jest.fn())
jest.mock('../src/full-jitter', () => jest.fn())
jest.mock('../src/execute-statement', () => jest.fn())
jest.mock('../src/inject-event', () => jest.fn())
jest.mock('../src/coercer', () => jest.fn())
jest.mock('../src/escape-id', () => jest.fn())
jest.mock('../src/escape', () => jest.fn())
jest.mock('../src/shape-event', () => jest.fn())
jest.mock('../src/connect', () => jest.fn())
jest.mock('../src/init-events', () => jest.fn())
jest.mock('../src/init-secrets', () => jest.fn())
jest.mock('../src/init-final', () => jest.fn())
jest.mock('../src/drop-events', () => jest.fn())
jest.mock('../src/drop-secrets', () => jest.fn())
jest.mock('../src/drop-final', () => jest.fn())
jest.mock('../src/dispose', () => jest.fn())
jest.mock('../src/get-secret', () => jest.fn())
jest.mock('../src/set-secret', () => jest.fn())
jest.mock('../src/delete-secret', () => jest.fn())
jest.mock('../src/load-snapshot', () => jest.fn())
jest.mock('../src/save-snapshot', () => jest.fn())
jest.mock('../src/drop-snapshot', () => jest.fn())
jest.mock('../src/begin-incremental-import', () => jest.fn())
jest.mock('../src/commit-incremental-import', () => jest.fn())
jest.mock('../src/rollback-incremental-import', () => jest.fn())
jest.mock('../src/push-incremental-import', () => jest.fn())
jest.mock('../src/load-secrets', () => jest.fn())
jest.mock('../src/inject-secret', () => jest.fn())

jest.mock('../src/resource/create', () => jest.fn())
jest.mock('../src/resource/dispose', () => jest.fn())
jest.mock('../src/resource/destroy', () => jest.fn())

const mGenericCreateAdapter = mocked(genericCreateAdapter)
const mCreateResource = mocked(createResource)
const mDisposeResource = mocked(disposeResource)
const mDestroyResource = mocked(destroyResource)

test('generic createAdapter invoked', () => {
  createAdapter({
    dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
    awsSecretStoreArn: 'awsSecretStoreArn',
    databaseName: 'databaseName',
  })
  expect(mGenericCreateAdapter).toHaveBeenCalledWith(
    {
      connect,
      loadEventsByCursor,
      loadEventsByTimestamp,
      getLatestEvent,
      saveEvent,
      initEvents,
      initSecrets,
      initFinal,
      dropEvents,
      dropSecrets,
      dropFinal,
      dispose,
      freeze,
      unfreeze,
      injectEvent,
      shapeEvent,
      deleteSecret,
      getSecret,
      setSecret,
      loadSnapshot,
      saveSnapshot,
      dropSnapshot,
      beginIncrementalImport,
      commitIncrementalImport,
      rollbackIncrementalImport,
      pushIncrementalImport,
      loadSecrets,
      injectSecret,
    },
    {
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer,
    },
    {
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      awsSecretStoreArn: 'awsSecretStoreArn',
      databaseName: 'databaseName',
    }
  )
})

describe('as cloud resource', () => {
  let cloudPool: CloudResourcePool
  let options: CloudResourceOptions
  let completePool: CloudResourcePool & CloudResource

  beforeEach(() => {
    cloudPool = {
      executeStatement,
      connect,
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      coercer,
      dispose,
      shapeEvent,
    }
    options = {
      awsSecretStoreAdminArn: 'admin-arn',
      databaseName: 'database',
      dbClusterOrInstanceArn: 'cluster-arn',
      region: 'region',
      secretsTableName: 'secrets-table',
      eventsTableName: 'table',
      userLogin: 'user',
      snapshotsTableName: 'snapshots-table',
    }
    completePool = {
      ...cloudPool,
      createResource: exportedCreate,
      disposeResource: exportedDispose,
      destroyResource: exportedDestroy,
    }
  })

  afterEach(() => {
    mCreateResource.mockClear()
    mDisposeResource.mockClear()
    mDestroyResource.mockClear()
  })

  test('create', () => {
    exportedCreate(options)
    expect(mCreateResource).toHaveBeenCalledWith(completePool, options)
  })

  test('destroy', () => {
    exportedDestroy(options)
    expect(mDestroyResource).toHaveBeenCalledWith(completePool, options)
  })

  test('dispose', () => {
    exportedDispose(options)
    expect(mDisposeResource).toHaveBeenCalledWith(completePool, options)
  })
})
