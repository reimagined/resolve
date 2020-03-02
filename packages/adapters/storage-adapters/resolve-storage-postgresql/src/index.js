import { Client as Postgres } from 'pg'
import _createAdapter from 'resolve-storage-base'

import connect from './connect'
import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import freeze from './freeze'
import unfreeze from './unfreeze'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import saveEventOnly from './save-event-only'
import paginateEvents from './paginate-events'
import coercer from './coercer'
import escapeId from './escape-id'
import escape from './escape'
import shapeEvent from './shape-event'

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
  saveEventOnly,
  paginateEvents,
  coercer,
  shapeEvent
})

export default createAdapter
