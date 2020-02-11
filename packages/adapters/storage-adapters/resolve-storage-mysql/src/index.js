import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

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
import freeze from './freeze'
import unfreeze from './unfreeze'

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
  freeze,
  unfreeze,
  MySQL,
  escapeId,
  escape
})
