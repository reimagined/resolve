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

const store = {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
}

const connect = _connect.bind(null, {
  Postgres,
  escapeId,
  escape,
  buildUpsertDocument,
  convertResultRow,
  searchToWhereExpression,
  updateToSetExpression,
  ...store,
})

const createAdapter = _createAdapter.bind(null, {
  ...store,
  connect,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  dropReadModel,
  disconnect,
})

export default createAdapter
