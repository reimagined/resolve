import { MongoClient } from 'mongodb'
import createAdapter from 'resolve-storage-base'

import connect from './connect'
import loadEvents from './load-events'
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

export default createAdapter.bind(null, {
  connect,
  loadEvents,
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
  MongoClient
})
