/* eslint-disable import/no-extraneous-dependencies */
import { Client as Postgres } from 'pg'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import genericCreateAdapter from 'resolve-eventstore-base'

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
import init from '../src/init'
import drop from '../src/drop'
import dispose from '../src/dispose'
import deleteSecret from '../src/delete-secret'
import setSecret from '../src/set-secret'
import getSecret from '../src/get-secret'
import loadSnapshot from '../src/load-snapshot'
import saveSnapshot from '../src/save-snapshot'
import dropSnapshot from '../src/drop-snapshot'
import beginIncrementalImport from '../src/begin-incremental-import'
import commitIncrementalImport from '../src/commit-incremental-import'
import rollbackIncrementalImport from '../src/rollback-incremental-import'
import pushIncrementalImport from '../src/push-incremental-import'

import createAdapter from '../src/index'

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
jest.mock('../src/init', () => jest.fn())
jest.mock('../src/drop', () => jest.fn())
jest.mock('../src/dispose', () => jest.fn())
jest.mock('../src/delete-secret', () => jest.fn())
jest.mock('../src/set-secret', () => jest.fn())
jest.mock('../src/get-secret', () => jest.fn())
jest.mock('../src/load-snapshot', () => jest.fn())
jest.mock('../src/save-snapshot', () => jest.fn())
jest.mock('../src/drop-snapshot', () => jest.fn())
jest.mock('../src/begin-incremental-import', () => jest.fn())
jest.mock('../src/commit-incremental-import', () => jest.fn())
jest.mock('../src/rollback-incremental-import', () => jest.fn())
jest.mock('../src/push-incremental-import', () => jest.fn())

const mGenericCreateAdapter = mocked(genericCreateAdapter)

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
    Postgres,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    injectEvent,
    coercer,
    shapeEvent,
    getSecret,
    setSecret,
    deleteSecret,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    beginIncrementalImport,
    commitIncrementalImport,
    rollbackIncrementalImport,
    pushIncrementalImport,
  })
})
