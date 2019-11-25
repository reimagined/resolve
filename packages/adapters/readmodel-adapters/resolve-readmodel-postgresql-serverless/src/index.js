import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import _createAdapter from 'resolve-readmodel-base'

import beginTransaction from './begin-transaction'
import buildUpsertDocument from './build-upsert-document'
import commitTransaction from './commit-transaction'
import coercer from './coercer'
import _connect from './connect'
import convertResultRow from './convert-result-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import escapeId from './escape-id'
import escape from './escape'
import executeStatement from './execute-statement'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import rollbackTransaction from './rollback-transaction'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import update from './update'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'

const store = { defineTable, find, findOne, count, insert, update, delete: del }

const connect = _connect.bind(null, {
  RDSDataService,
  escapeId,
  escape,
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  executeStatement,
  coercer,
  ...store
})

const createAdapter = _createAdapter.bind(null, {
  ...store,
  connect,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  dropReadModel,
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
