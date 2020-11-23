import _createAdapter from 'resolve-readmodel-base'
import { Client as Postgres } from 'pg'

import beginTransaction from './begin-transaction'
import buildUpsertDocument from './build-upsert-document'
import commitTransaction from './commit-transaction'
import _connect from './connect'
import convertResultRow from './convert-result-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import escapeId from './escape-id'
import escape from './escape'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import rollbackTransaction from './rollback-transaction'
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

const store = {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
}

const internalMethods = {
  escapeId,
  escape,
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  PassthroughError,
  inlineLedgerForceStop,
  generateGuid,
}

const externalMethods = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
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
  build,
}

const connect = _connect.bind(null, {
  Postgres,
  ...internalMethods,
  ...externalMethods,
  ...store,
})

const createAdapter = _createAdapter.bind(null, {
  ...store,
  ...externalMethods,
  connect,
  disconnect,
})

export default createAdapter
