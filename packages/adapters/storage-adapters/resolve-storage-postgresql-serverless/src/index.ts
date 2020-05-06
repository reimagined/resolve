import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-storage-base'

import loadEventsByCursor from './js/load-events-by-cursor'
import loadEventsByTimestamp from './js/load-events-by-timestamp'
import freeze from './js/freeze'
import unfreeze from './js/unfreeze'
import getLatestEvent from './js/get-latest-event'
import saveEvent from './js/save-event'
import fullJitter from './js/full-jitter'
import executeStatement from './js/execute-statement'
import saveEventOnly from './js/save-event-only'
import paginateEvents from './js/paginate-events'
import coercer from './js/coercer'
import escapeId from './js/escape-id'
import escape from './js/escape'
import shapeEvent from './js/shape-event'

import connect from './connect'
import init from './js/init'
import drop from './js/drop'
import dispose from './js/dispose'

import _createResource from './js/resource/create'
import _disposeResource from './js/resource/dispose'
import _destroyResource from './js/resource/destroy'

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
  RDSDataService,
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

const pool = {
  executeStatement,
  connect,
  RDSDataService,
  escapeId,
  escape,
  fullJitter,
  coercer,
  dispose,
  shapeEvent
}

const createResource = _createResource.bind(null, pool)
const disposeResource = _disposeResource.bind(null, pool)
const destroyResource = _destroyResource.bind(null, pool)

Object.assign(pool, {
  createResource,
  disposeResource,
  destroyResource
})

export {
  createResource as create,
  disposeResource as dispose,
  destroyResource as destroy
}
