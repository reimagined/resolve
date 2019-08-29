import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import freeze from './freeze'
import unfreeze from './unfreeze'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'
import exportStream from './export'
import importStream from './import'

import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import coercer from './coercer'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const createAdapter = _createAdapter.bind(null, {
  connect,
  init,
  loadEvents,
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  freeze,
  unfreeze,
  import: importStream,
  export: exportStream,
  RDSDataService,
  escapeId,
  escape,
  fullJitter,
  executeStatement,
  coercer
})

export default createAdapter

const pool = {
  executeStatement,
  connect,
  init,
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
