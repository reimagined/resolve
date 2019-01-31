import NeDB from 'nedb'

import createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import dispose from './dispose'
import promiseInvoke from './promise-invoke'

export default createAdapter.bind(
  null,
  connect,
  init,
  loadEvents,
  getLatestEvent,
  saveEvent,
  dispose,
  { NeDB, promiseInvoke }
)
