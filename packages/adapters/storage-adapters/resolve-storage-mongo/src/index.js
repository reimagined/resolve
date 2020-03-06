import { MongoClient } from 'mongodb'
import createAdapter from 'resolve-storage-base'

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
import isFrozen from './is-frozen'
import freeze from './freeze'
import unfreeze from './unfreeze'
import shapeEvent from './shape-event'

export default createAdapter.bind(null, {
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
  isFrozen,
  freeze,
  unfreeze,
  MongoClient,
  shapeEvent
})
