import { Client as Postgres } from 'pg'
import _createAdapter from 'resolve-eventstore-base'

import loadEventsByCursor from './js/load-events-by-cursor'
import loadEventsByTimestamp from './js/load-events-by-timestamp'
import freeze from './js/freeze'
import unfreeze from './js/unfreeze'
import getLatestEvent from './js/get-latest-event'
import saveEvent from './js/save-event'
import fullJitter from './js/full-jitter'
import executeStatement from './js/execute-statement'
import injectEvent from './js/inject-event'
import coercer from './js/coercer'
import escapeId from './js/escape-id'
import escape from './js/escape'
import shapeEvent from './js/shape-event'

import connect from './connect'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import getSecretsManager from './secrets-manager'

const createAdapter = _createAdapter.bind(null, {
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
  getSecretsManager
})

export default createAdapter
