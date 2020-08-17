import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-readmodel-base'
import crypto from 'crypto'

import _connect from './connect'
import disconnect from './disconnect'

import count from './count'
import defineTable from './define-table'
import del from './delete'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import update from './update'

import beginTransaction from './begin-transaction'
import buildUpsertDocument from './build-upsert-document'
import commitTransaction from './commit-transaction'
import coercer from './coercer'
import convertResultRow from './convert-result-row'
import escapeId from './escape-id'
import escape from './escape'
import executeStatement from './execute-statement'
import rollbackTransaction from './rollback-transaction'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'

import PassthroughError from './passthrough-error'
import inlineLedgerExecuteStatement from './inline-ledger-execute-statement'
import inlineLedgerForceStop from './inline-ledger-force-stop'
import generateGuid from './generate-guid'
import isHighloadError from './is-highload-error'
import isTimeoutError from './is-timeout-error'

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

import beginXATransaction from './begin-xa-transaction'
import beginEvent from './begin-event'
import commitXATransaction from './commit-xa-transaction'
import commitEvent from './commit-event'
import rollbackXATransaction from './rollback-xa-transaction'
import rollbackEvent from './rollback-event'
import dropReadModel from './drop-read-model'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const store = { defineTable, find, findOne, count, insert, update, delete: del }

const internalMethods = {
  escapeId,
  escape,
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  executeStatement,
  coercer,
  generateGuid,
  PassthroughError,
  inlineLedgerExecuteStatement,
  inlineLedgerForceStop,
  isTimeoutError,
  isHighloadError
}

const externalMethods = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  beginXATransaction,
  commitXATransaction,
  rollbackXATransaction,
  beginEvent,
  commitEvent,
  rollbackEvent,
  dropReadModel,
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
  build
}

const connect = _connect.bind(null, {
  RDSDataService,
  crypto,
  ...internalMethods,
  ...externalMethods,
  ...store
})

const createAdapter = _createAdapter.bind(null, {
  ...store,
  ...externalMethods,
  connect,
  disconnect
})

export default createAdapter

const pool = {
  connect,
  disconnect,
  escapeId,
  escape
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
