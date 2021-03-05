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
} from './types'

import buildUpsertDocument from './build-upsert-document'
import _connect from './connect'
import convertResultRow from './convert-result-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
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
  escapeId,
  escapeStr,
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  PassthroughError,
  inlineLedgerForceStop,
  generateGuid,
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
