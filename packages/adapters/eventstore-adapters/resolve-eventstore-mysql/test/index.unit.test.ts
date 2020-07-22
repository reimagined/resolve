/* eslint-disable import/no-extraneous-dependencies */
import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'
import { mocked } from 'ts-jest/utils'
import genericCreateAdapter from 'resolve-eventstore-base'
/* eslint-enable import/no-extraneous-dependencies */

import loadEventsByCursor from '../src/js/load-events-by-cursor'
import loadEventsByTimestamp from '../src/js/load-events-by-timestamp'
import getLatestEvent from '../src/js/get-latest-event'
import saveEvent from '../src/js/save-event'
import injectEvent from '../src/js/inject-event'
import freeze from '../src/js/freeze'
import unfreeze from '../src/js/unfreeze'
import shapeEvent from '../src/js/shape-event'
import loadSnapshot from '../src/js/load-snapshot'
import saveSnapshot from '../src/js/save-snapshot'
import dropSnapshot from '../src/js/drop-snapshot'
import connect from '../src/connect'
import init from '../src/init'
import drop from '../src/drop'
import dispose from '../src/dispose'
import getSecretsManager from '../src/secrets-manager'
import createAdapter from '../src/index'
import beginIncrementalImport from '../src/js/begin-incremental-import'
import commitIncrementalImport from '../src/js/commit-incremental-import'
import rollbackIncrementalImport from '../src/js/rollback-incremental-import'
import pushIncrementalImport from '../src/js/push-incremental-import'

jest.mock('../src/js/load-events-by-cursor', () => jest.fn())
jest.mock('../src/js/load-events-by-timestamp', () => jest.fn())
jest.mock('../src/js/get-latest-event', () => jest.fn())
jest.mock('../src/js/save-event', () => jest.fn())
jest.mock('../src/js/inject-event', () => jest.fn())
jest.mock('../src/js/freeze', () => jest.fn())
jest.mock('../src/js/unfreeze', () => jest.fn())
jest.mock('../src/js/shape-event', () => jest.fn())
jest.mock('../src/js/load-snapshot', () => jest.fn())
jest.mock('../src/js/save-snapshot', () => jest.fn())
jest.mock('../src/js/drop-snapshot', () => jest.fn())
jest.mock('../src/connect', () => jest.fn())
jest.mock('../src/init', () => jest.fn())
jest.mock('../src/drop', () => jest.fn())
jest.mock('../src/dispose', () => jest.fn())
jest.mock('../src/secrets-manager', () => jest.fn())
jest.mock('../src/js/begin-incremental-import', () => jest.fn())
jest.mock('../src/js/commit-incremental-import', () => jest.fn())
jest.mock('../src/js/rollback-incremental-import', () => jest.fn())
jest.mock('../src/js/push-incremental-import', () => jest.fn())

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
    injectEvent,
    freeze,
    unfreeze,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    shapeEvent,
    beginIncrementalImport,
    commitIncrementalImport,
    rollbackIncrementalImport,
    pushIncrementalImport,
    getSecretsManager,
    MySQL,
    escapeId,
    escape
  })
})
