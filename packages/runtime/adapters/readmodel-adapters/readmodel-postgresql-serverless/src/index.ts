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
  AdminPool,
} from './types'

import _connect from './connect'
import disconnect from './disconnect'

import count from './count'
import defineTable from './define-table'
import del from './delete'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import update from './update'

import buildUpsertDocument from './build-upsert-document'
import coercer from './coercer'
import convertResultRow from './convert-result-row'
import escapeId from './escape-id'
import escapeStr from './escape-str'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'

import PassthroughError from './passthrough-error'
import inlineLedgerExecuteStatement from './inline-ledger-execute-statement'
import inlineLedgerForceStop from './inline-ledger-force-stop'
import generateGuid from './generate-guid'
import isHighloadError from './is-highload-error'
import isTimeoutError from './is-timeout-error'

import dropReadModel from './drop-read-model'
import subscribe from './subscribe'
import resubscribe from './resubscribe'
import unsubscribe from './unsubscribe'
import deleteProperty from './delete-property'
import getProperty from './get-property'
import listProperties from './list-properties'
import setProperty from './set-property'
import reset from './reset'
import pause from './pause'
import resume from './resume'
import status from './status'
import build from './build'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

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
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  coercer,
  generateGuid,
  PassthroughError,
  inlineLedgerExecuteStatement,
  inlineLedgerForceStop,
  isTimeoutError,
  isHighloadError,
  dropReadModel,
  escapeId,
  escapeStr,
}

const externalMethods: ExternalMethods = {
  subscribe,
  resubscribe,
  unsubscribe,
  deleteProperty,
  getProperty,
  listProperties,
  setProperty,
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

const pool = {
  connect,
  disconnect,
  escapeId,
  escapeStr,
} as AdminPool

const createResource = _createResource.bind(null, pool)
const disposeResource = _disposeResource.bind(null, pool)
const destroyResource = _destroyResource.bind(null, pool)

Object.assign(pool, {
  createResource,
  disposeResource,
  destroyResource,
})

export {
  createResource as create,
  disposeResource as dispose,
  destroyResource as destroy,
}
