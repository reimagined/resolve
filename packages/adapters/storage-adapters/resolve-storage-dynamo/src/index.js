// as adapter
import DynamoDB from 'aws-sdk/clients/dynamodb'
import _createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import _dispose from './dispose'
import createQuery from './create-query'
import createTypeExpression from './create-type-expression'
import createTimestampExpression from './create-timestamp-expression'
import createAggregateIdExpression from './create-aggregate-id-expression'
import expressionObject from './expression-object'
import expressionString from './expression-string'
import checkTableExists from './check-table-exists'
import executePaginationQuery from './execute-pagination-query'
import executeSingleQuery from './execute-single-query'
import encodeEmptyStrings from './encode-empty-strings'
import decodeEmptyStrings from './decode-empty-strings'
import _encodeEvent from './encode-event'
import _decodeEvent from './decode-event'
import { globalPartitionKey, rangedIndex, apiVersion } from './constants'

// as resource
import ApplicationAutoScaling from 'aws-sdk/clients/applicationautoscaling'

import setupAutoScaling from './resource/setup-auto-scaling'
import setupAutoScalingItem from './resource/setup-auto-scaling-item'
import resourceCreate from './resource/create'
import resourceDispose from './resource/dispose'
import resourceDestroy from './resource/destroy'

// as adapter
const createAdapter = _createAdapter.bind(
  null,
  connect,
  init,
  loadEvents,
  getLatestEvent,
  saveEvent,
  _dispose,
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
    executeSingleQuery,
    encodeEmptyStrings,
    decodeEmptyStrings,
    encodeEvent: _encodeEvent,
    decodeEvent: _decodeEvent
  }
)
export { globalPartitionKey, rangedIndex, apiVersion }

export default createAdapter

// as resource
const pool = {
  createAdapter,
  setupAutoScaling,
  setupAutoScalingItem,
  create: resourceCreate,
  dispose: resourceDispose,
  destroy: resourceDestroy,
  ApplicationAutoScaling,
  encodeEmptyStrings,
  decodeEmptyStrings
}

const create = resourceCreate.bind(null, pool)
const dispose = resourceDispose.bind(null, pool)
const destroy = resourceDestroy.bind(null, pool)

export { create, dispose, destroy, decodeEmptyStrings }

const encodeEvent = _encodeEvent.bind(null, pool)
const decodeEvent = _decodeEvent.bind(null, pool)

export { encodeEvent, decodeEvent }
