import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import connect from './connect'
import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import paginateEvents from './paginate-events'
import saveEventOnly from './save-event-only'
import freeze from './freeze'
import unfreeze from './unfreeze'
import shapeEvent from './shape-event'

const wrappedCreateAdapter = createAdapter.bind(null, {
  connect,
  loadEventsByCursor,
  loadEventsByTimestamp,
  getLatestEvent,
  saveEvent,
  init,
  drop,
  dispose,
  paginateEvents,
  saveEventOnly,
  freeze,
  unfreeze,
  shapeEvent,
  sqlite,
  tmp,
  os,
  fs
})

export default wrappedCreateAdapter
