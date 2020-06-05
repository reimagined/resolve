import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from 'resolve-eventstore-base'

import loadEventsByCursor from './js/load-events-by-cursor'
import loadEventsByTimestamp from './js/load-events-by-timestamp'
import getLatestEvent from './js/get-latest-event'
import saveEvent from './js/save-event'
import saveEventOnly from './js/save-event-only'
import freeze from './js/freeze'
import unfreeze from './js/unfreeze'
import shapeEvent from './js/shape-event'
import saveSnapshot from './js/save-snapshot'
import loadSnapshot from './js/load-snapshot'
import dropSnapshot from './js/drop-snapshot'

import connect from './connect'
import init from './init'
import dispose from './dispose'
import drop from './drop'
import getSecretsManager from './secrets-manager'

export default createAdapter.bind(null, {
  connect,
  loadEventsByCursor,
  loadEventsByTimestamp,
  getLatestEvent,
  saveEvent,
  init,
  drop,
  dispose,
  saveEventOnly,
  freeze,
  unfreeze,
  shapeEvent,
  getSecretsManager,
  saveSnapshot,
  loadSnapshot,
  dropSnapshot,
  MySQL,
  escapeId,
  escape
})
