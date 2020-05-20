import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from 'resolve-eventstore-base'

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
  shapeEvent,
  MySQL,
  escapeId,
  escape
})
