import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'
import exportStream from './export'
import importStream from './import'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const createAdapter = _createAdapter.bind(null, {
  connect,
  init,
  loadEvents,
  import: importStream,
  export: exportStream,
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  RDSDataService,
  escapeId,
  escape
})

export default createAdapter

const pool = {
  createAdapter
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
