import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'
import tmp from 'tmp'

import connect from './connect'
import loadEvents from './load-events'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import paginateEvents from './paginate-events'
import saveEventOnly from './save-event-only'
import freeze from './freeze'
import unfreeze from './unfreeze'

const wrappedCreateAdapter = createAdapter.bind(null, {
  connect,
  loadEvents,
  getLatestEvent,
  saveEvent,
  init,
  drop,
  dispose,
  paginateEvents,
  saveEventOnly,
  freeze,
  unfreeze,
  sqlite,
  tmp
})

export default wrappedCreateAdapter
