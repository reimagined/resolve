import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from 'resolve-eventstore-base'

import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import injectEvent from './inject-event'
import freeze from './freeze'
import unfreeze from './unfreeze'
import shapeEvent from './shape-event'
import saveSnapshot from './save-snapshot'
import loadSnapshot from './load-snapshot'
import dropSnapshot from './drop-snapshot'
import beginIncrementalImport from './begin-incremental-import'
import commitIncrementalImport from './commit-incremental-import'
import rollbackIncrementalImport from './rollback-incremental-import'
import pushIncrementalImport from './push-incremental-import'
import deleteSecret from './delete-secret'
import getSecret from './get-secret'
import setSecret from './set-secret'

import connect from './connect'
import init from './init'
import dispose from './dispose'
import drop from './drop'

export default createAdapter.bind(null, {
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
  shapeEvent,
  saveSnapshot,
  loadSnapshot,
  dropSnapshot,
  beginIncrementalImport,
  commitIncrementalImport,
  rollbackIncrementalImport,
  pushIncrementalImport,
  deleteSecret,
  getSecret,
  setSecret,
  MySQL,
  escapeId,
  escape,
})
