import _createAdapter from '@resolve-js/readmodel-base'
import { Client as Postgres } from 'pg'

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

import buildUpsertDocument from './build-upsert-document'
import _connect from './connect'
import convertResultRow from './convert-result-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import maybeInit from './maybe-init'
import escapeId from './escape-id'
import escapeStr from './escape-str'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import update from './update'

import PassthroughError from './passthrough-error'
import inlineLedgerForceStop from './inline-ledger-force-stop'
import generateGuid from './generate-guid'
import makeNestedPath from './make-nested-path'
import makeSqlQuery from './make-sql-query'

import subscribe from './subscribe'
import resubscribe from './resubscribe'
import unsubscribe from './unsubscribe'
import reset from './reset'
import pause from './pause'
import resume from './resume'
import status from './status'
import build from './build'

import _createResource from './resource/create'
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
  PassthroughError,
  inlineLedgerForceStop,
  makeNestedPath,
  makeSqlQuery,
  generateGuid,
  maybeInit,
  dropReadModel,
  escapeId,
  escapeStr,
}

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
  Postgres,
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
const destroyResource = _destroyResource.bind(null, pool)

Object.assign(pool, {
  createResource,
  destroyResource,
})

export { createResource as create, destroyResource as destroy }
