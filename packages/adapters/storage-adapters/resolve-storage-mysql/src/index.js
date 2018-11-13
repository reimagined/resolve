import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import saveEvent from './save-event'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  connect,
  init,
  loadEvents,
  saveEvent,
  dispose,
  {
    MySQL,
    escapeId,
    escape
  }
)
