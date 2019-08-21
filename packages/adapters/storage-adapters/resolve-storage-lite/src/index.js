import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import getEventStream from './get-event-stream'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'

const wrappedCreateAdapter = createAdapter.bind(null, {
  connect,
  init,
  loadEvents,
  getEventStream,
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  sqlite
})

export default wrappedCreateAdapter
