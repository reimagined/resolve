import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import checkEventStoreActive from './check-event-store-active'
import activateEventStore from './activate-event-store'
import deactivateEventStore from './deactivate-event-store'
import getEventStream from './get-event-stream'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'

const wrappedCreateAdapter = createAdapter.bind(null, {
  connect,
  init,
  loadEvents,
  checkEventStoreActive,
  activateEventStore,
  deactivateEventStore,
  getEventStream,
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  sqlite
})

export default wrappedCreateAdapter
