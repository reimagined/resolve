import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import rollbackTransaction from './rollbackTransaction'
import commitTransaction from './commitTransaction'
import executeStatement from './executeStatement'
import beginTransaction from './beginTransaction'
import loadSnapshot from './loadSnapshot'
import dropSnapshot from './dropSnapshot'
import saveSnapshot from './saveSnapshot'
import connect from './connect'
import coercer from './coercer'
import dispose from './dispose'
import drop from './drop'
import init from './init'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const createAdapter = config => {
  const pool = {
    executeStatement,
    commitTransaction,
    rollbackTransaction,
    beginTransaction,
    connect,
    RDSDataService,
    escape,
    escapeId,
    coercer,
    dispose
  }

  Object.assign(pool, { config })

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool),
    init: init.bind(null, pool),
    dropSnapshot: dropSnapshot.bind(null, pool),
    drop: drop.bind(null, pool)
  })
}

const resourcePool = {
  executeStatement,
  commitTransaction,
  rollbackTransaction,
  beginTransaction,
  connect,
  RDSDataService,
  escape,
  escapeId,
  coercer,
  dispose,
  init
}

const createResource = _createResource.bind(null, resourcePool)
const disposeResource = _disposeResource.bind(null, resourcePool)
const destroyResource = _destroyResource.bind(null, resourcePool)

Object.assign(resourcePool, {
  createResource,
  disposeResource,
  destroyResource
})

export {
  createResource as create,
  disposeResource as dispose,
  destroyResource as destroy
}

export default createAdapter
