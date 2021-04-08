import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from '@resolve-js/readmodel-base'
import crypto from 'crypto'

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

import coercer from './coercer'
import escapeId from './escape-id'
import escapeStr from './escape-str'

import dropReadModel from './drop-read-model'
import resubscribe from './resubscribe'
import unsubscribe from './unsubscribe'
import reset from './reset'
import pause from './pause'
import resume from './resume'
import status from './status'
import build from './build'

import isHighloadError from './is-highload-error'

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
  coercer,
  isHighloadError,
  dropReadModel,
  escapeId,
  escapeStr,
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
  RDSDataService,
  crypto,
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
