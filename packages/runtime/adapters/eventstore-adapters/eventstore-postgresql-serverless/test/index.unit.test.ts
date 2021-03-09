/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */

import fullJitter from '../src/full-jitter'
import executeStatement from '../src/execute-statement'
import coercer from '../src/coercer'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import shapeEvent from '../src/shape-event'
import connect from '../src/connect'
import dispose from '../src/dispose'

import createResource from '../src/resource/create'
import disposeResource from '../src/resource/dispose'
import destroyResource from '../src/resource/destroy'

import {
  create as exportedCreate,
  destroy as exportedDestroy,
  dispose as exportedDispose,
} from '../src'
import {
  CloudResource,
  CloudResourceOptions,
  CloudResourcePool,
} from '../src/types'

jest.mock('../src/full-jitter', () => jest.fn())
jest.mock('../src/execute-statement', () => jest.fn())
jest.mock('../src/coercer', () => jest.fn())
jest.mock('../src/escape-id', () => jest.fn())
jest.mock('../src/escape', () => jest.fn())
jest.mock('../src/shape-event', () => jest.fn())
jest.mock('../src/connect', () => jest.fn())
jest.mock('../src/dispose', () => jest.fn())

jest.mock('../src/resource/create', () => jest.fn())
jest.mock('../src/resource/dispose', () => jest.fn())
jest.mock('../src/resource/destroy', () => jest.fn())

const mCreateResource = mocked(createResource)
const mDisposeResource = mocked(disposeResource)
const mDestroyResource = mocked(destroyResource)

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
      subscribersTableName: 'subscribers-table-name',
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
