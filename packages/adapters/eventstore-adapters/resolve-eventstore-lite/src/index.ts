import createAdapter from 'resolve-eventstore-base'
import sqlite from 'sqlite'
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import loadEventsByCursor from './js/load-events-by-cursor'
import loadEventsByTimestamp from './js/load-events-by-timestamp'
import getLatestEvent from './js/get-latest-event'
import saveEvent from './js/save-event'
import saveEventOnly from './js/save-event-only'
import freeze from './js/freeze'
import unfreeze from './js/unfreeze'
import shapeEvent from './js/shape-event'
import loadSnapshot from './js/load-snapshot'
import dropSnapshot from './js/drop-snapshot'
import saveSnapshot from './js/save-snapshot'

import connect from './connect'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import getSecretsManager from './secrets-manager'

const wrappedCreateAdapter = createAdapter.bind(null, {
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
  dropSnapshot,
  loadSnapshot,
  sqlite,
  tmp,
  os,
  fs
})

export default wrappedCreateAdapter
