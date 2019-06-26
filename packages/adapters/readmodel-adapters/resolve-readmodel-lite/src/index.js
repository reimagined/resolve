import createAdapter from 'resolve-readmodel-base'
import SQLite from 'sqlite'
import tmp from 'tmp'
import os from 'os'

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

const memoryStore = {}
const store = { defineTable, find, findOne, count, insert, update, delete: del }

export default createAdapter.bind(null, {
  ...store,
  connect: connect.bind(null, {
    buildUpsertDocument,
    convertBinaryRow,
    searchToWhereExpression,
    updateToSetExpression,
    memoryStore,
    ...store,
    SQLite,
    tmp,
    os
  }),
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  dropReadModel,
  disconnect
})
