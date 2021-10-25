import _createAdapter from '@resolve-js/readmodel-base'

import type {
  CurrentAdapterImplementation,
  InternalMethods,
  ExternalMethods,
  CurrentStoreApi,
  AdapterPool,
  AdapterOptions,
  AdapterApi,
  CurrentDisconnectMethod,
} from './types'

import _connect from './connect'

import dropReadModel from './drop-read-model'
import resubscribe from './resubscribe'
import unsubscribe from './unsubscribe'
import reset from './reset'
import pause from './pause'
import resume from './resume'
import status from './status'
import build from './build'

import getReplicationState from './get-replication-state'
import callReplicate from './call-replicate'
import setReplicationPaused from './set-replication-paused'
import occupyReplication from './occupy-replication'
import releaseReplication from './release-replication'

const defineTable = (async (...args) => {
  return
}) as CurrentStoreApi['defineTable']
const find = (async (...args) => {
  return []
}) as CurrentStoreApi['find']
const findOne = (async (...args) => {
  return null
}) as CurrentStoreApi['findOne']
const count = (async (...args) => {
  return 0
}) as CurrentStoreApi['count']
const insert = (async (...args) => {
  return
}) as CurrentStoreApi['insert']
const update = (async (...args) => {
  return
}) as CurrentStoreApi['update']
const del = (async (...args) => {
  return
}) as CurrentStoreApi['delete']

const store: CurrentStoreApi = {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
}

const internalMethods: InternalMethods = {
  dropReadModel,
  getReplicationState,
  callReplicate,
  setReplicationPaused,
  occupyReplication,
  releaseReplication,
}

const subscribe = (async (...args) => {
  return
}) as ExternalMethods['subscribe']

const externalMethods: ExternalMethods = {
  subscribe,
  resubscribe,
  unsubscribe,
  resume,
  pause,
  reset,
  status,
  build,
}

const connect = _connect.bind(null, {
  ...internalMethods,
  ...externalMethods,
  ...store,
})

//eslint-disable-next-line @typescript-eslint/no-empty-function
const disconnect: CurrentDisconnectMethod = async () => {}

const implementation: CurrentAdapterImplementation = {
  ...store,
  ...externalMethods,
  connect,
  disconnect,
}

const createAdapter = _createAdapter.bind<
  null,
  CurrentAdapterImplementation,
  [AdapterOptions],
  AdapterApi<AdapterPool>
>(null, implementation)

export default createAdapter
