import { MongoClient, ObjectID } from 'mongodb'
import createAdapter from 'resolve-readmodel-base'

import connect from './connect'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import update from './update'
import wrapSearchExpression from './wrap-search-expression'

const store = { defineTable, find, findOne, count, insert, update, delete: del }

export default createAdapter.bind(null, {
  ...store,
  connect: connect.bind(null, {
    MongoClient,
    ObjectID,
    wrapSearchExpression,
    ...store
  }),
  dropReadModel,
  disconnect
})
