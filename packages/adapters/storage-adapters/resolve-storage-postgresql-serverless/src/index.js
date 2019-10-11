import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-storage-base'

import connect from './connect'
import loadEvents from './load-events'
import freeze from './freeze'
import unfreeze from './unfreeze'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import init from './init'
import drop from './drop'
import dispose from './dispose'
import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import saveEventOnly from './save-event-only'
import paginateEvents from './paginate-events'
import coercer from './coercer'
import escapeId from './escape-id'
import escape from './escape'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const createAdapter = _createAdapter.bind(null, {
  connect,
  loadEvents,
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
  coercer
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
  dispose
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
