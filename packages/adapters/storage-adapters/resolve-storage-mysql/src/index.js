import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import checkEventStoreActive from './check-event-store-active'
import activateEventStore from './activate-event-store'
import deactivateEventStore from './deactivate-event-store'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'
import exportStream from './export'
import importStream from './import'

export default createAdapter.bind(null, {
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
  MySQL,
  escapeId,
  escape
})
