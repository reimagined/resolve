/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import genericCreateAdapter from 'resolve-eventstore-base'

import loadEventsByCursor from '../src/js/load-events-by-cursor'
import loadEventsByTimestamp from '../src/js/load-events-by-timestamp'
import freeze from '../src/js/freeze'
import unfreeze from '../src/js/unfreeze'
import getLatestEvent from '../src/js/get-latest-event'
import saveEvent from '../src/js/save-event'
import fullJitter from '../src/js/full-jitter'
import executeStatement from '../src/js/execute-statement'
import saveEventOnly from '../src/js/save-event-only'
import paginateEvents from '../src/js/paginate-events'
import coercer from '../src/js/coercer'
import escapeId from '../src/js/escape-id'
import escape from '../src/js/escape'
import shapeEvent from '../src/js/shape-event'
import connect from '../src/connect'
import init from '../src/init'
import drop from '../src/drop'
import dispose from '../src/dispose'
import getSecretsManager from '../src/secrets-manager'

import createResource from '../src/resource/create'
import disposeResource from '../src/resource/dispose'
import destroyResource from '../src/resource/destroy'

import createAdapter, {
  create as exportedCreate,
  destroy as exportedDestroy,
  dispose as exportedDispose
} from '../src/index'
import {
  CloudResource,
  CloudResourceOptions,
  CloudResourcePool
} from '../src/types'

jest.mock('../src/js/load-events-by-cursor', () => jest.fn())
jest.mock('../src/js/freeze', () => jest.fn())
jest.mock('../src/js/unfreeze', () => jest.fn())
jest.mock('../src/js/get-latest-event', () => jest.fn())
jest.mock('../src/js/save-event', () => jest.fn())
jest.mock('../src/js/full-jitter', () => jest.fn())
jest.mock('../src/js/execute-statement', () => jest.fn())
jest.mock('../src/js/save-event-only', () => jest.fn())
jest.mock('../src/js/paginate-events', () => jest.fn())
jest.mock('../src/js/coercer', () => jest.fn())
jest.mock('../src/js/escape-id', () => jest.fn())
jest.mock('../src/js/escape', () => jest.fn())
jest.mock('../src/js/shape-event', () => jest.fn())
jest.mock('../src/connect', () => jest.fn())
jest.mock('../src/init', () => jest.fn())
jest.mock('../src/drop', () => jest.fn())
jest.mock('../src/dispose', () => jest.fn())
jest.mock('../src/secrets-manager', () => jest.fn())

jest.mock('../src/resource/create', () => jest.fn())
jest.mock('../src/resource/dispose', () => jest.fn())
jest.mock('../src/resource/destroy', () => jest.fn())

const mGenericCreateAdapter = mocked(genericCreateAdapter)
const mCreateResource = mocked(createResource)
const mDisposeResource = mocked(disposeResource)
const mDestroyResource = mocked(destroyResource)

test('generic createAdapter invoked', () => {
  createAdapter()
  expect(mGenericCreateAdapter).toHaveBeenCalledWith({
    connect,
    loadEventsByCursor,
    loadEventsByTimestamp,
    getLatestEvent,
    saveEvent,
    init,
    drop,
    dispose,
    freeze,
    unfreeze,
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    saveEventOnly,
    paginateEvents,
    coercer,
    shapeEvent,
    getSecretsManager
  })
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
      shapeEvent
    }
    options = {
      awsSecretStoreAdminArn: 'admin-arn',
      awsSecretStoreArn: 'user-arn',
      databaseName: 'database',
      dbClusterOrInstanceArn: 'cluster-arn',
      region: 'region',
      secretsTableName: 'secrets-table',
      tableName: 'table',
      userLogin: 'user',
      snapshotsTableName: 'snapshots-table'
    }
    completePool = {
      ...cloudPool,
      createResource: exportedCreate,
      disposeResource: exportedDispose,
      destroyResource: exportedDestroy
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
