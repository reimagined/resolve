import DynamoDB from 'aws-sdk/clients/dynamodb'

import createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import saveEvent from './save-event'
import dispose from './dispose'
import createQuery from './create-query'
import createTypeExpression from './create-type-expression'
import createTimestampExpression from './create-timestamp-expression'
import createAggregateIdExpression from './create-aggregate-id-expression'
import expressionObject from './expression-object'
import expressionString from './expression-string'
import checkTableExists from './check-table-exists'
import executePaginationQuery from './execute-pagination-query'
import executeSingleQuery from './execute-single-query'
import { globalPartitionKey, rangedIndex, apiVersion } from './constants'

export default createAdapter.bind(
  null,
  connect,
  init,
  loadEvents,
  saveEvent,
  dispose,
  {
    DynamoDB,
    createTypeExpression,
    createTimestampExpression,
    createAggregateIdExpression,
    createQuery,
    expressionObject,
    expressionString,
    checkTableExists,
    executePaginationQuery,
    executeSingleQuery
  }
)

export { globalPartitionKey, rangedIndex, apiVersion }
