import createAdapter from 'resolve-storage-base'
import sqlite from 'sqlite'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import importStream from './import'
import exportStream from './export'
import checkEventStoreActive from './check-event-store-active'
import activateEventStore from './activate-event-store'
import deactivateEventStore from './deactivate-event-store'
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
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  export: exportStream,
  import: importStream,
  sqlite
})

export default wrappedCreateAdapter
