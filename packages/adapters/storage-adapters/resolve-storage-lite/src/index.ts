import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import connect from './js/connect'
import loadEventsByCursor from './js/load-events-by-cursor'
import loadEventsByTimestamp from './js/load-events-by-timestamp'
import getLatestEvent from './js/get-latest-event'
import saveEvent from './js/save-event'
import init from './js/init'
import drop from './js/drop'
import dispose from './js/dispose'
import paginateEvents from './js/paginate-events'
import saveEventOnly from './js/save-event-only'
import freeze from './js/freeze'
import unfreeze from './js/unfreeze'
import shapeEvent from './js/shape-event'

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
  paginateEvents,
  freeze,
  unfreeze,
  shapeEvent,
  sqlite,
  tmp,
  os,
  fs
})

export default wrappedCreateAdapter
