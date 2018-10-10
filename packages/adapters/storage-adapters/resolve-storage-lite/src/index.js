import NeDB from 'nedb'

import createAdapter from 'resolve-storage-base'

import init from './init'
import loadEvents from './load-events'
import saveEvent from './save-event'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  init,
  loadEvents,
  saveEvent,
  dispose,
  NeDB
)
