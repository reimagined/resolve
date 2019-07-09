import MySQL from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'
import createAdapter from 'resolve-readmodel-base'

import beginTransaction from './begin-transaction'
import buildUpsertDocument from './build-upsert-document'
import commitTransaction from './commit-transaction'
import connect from './connect'
import convertBinaryRow from './convert-binary-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import rollbackTransaction from './rollback-transaction'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import update from './update'

const store = { defineTable, find, findOne, count, insert, update, delete: del }

export default createAdapter.bind(null, {
  ...store,
  connect: connect.bind(null, {
    MySQL,
    escapeId,
    escape,
    buildUpsertDocument,
    convertBinaryRow,
    searchToWhereExpression,
    updateToSetExpression,
    ...store
  }),
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  dropReadModel,
  disconnect
})
