import { take, put, delay } from 'redux-saga/effects'

import getHash from '../get-hash'
import eventListenerSaga from './event-listener-saga'
import { subscribeTopicRequest, queryViewModelRequest } from './actions'
import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  QUERY_VIEWMODEL_SUCCESS,
  QUERY_VIEWMODEL_FAILURE
} from '../action-types'
import { HttpError } from '../create_api'

const connectViewModelSaga = function*(
  sagaArgs: any,
  action: {
    viewModelName: string
    aggregateIds: string | string[]
    aggregateArgs: any
  }
) {
  const {
    viewModels,
    connectionManager,
    sagaManager,
    sagaKey,
    skipConnectionManager
  } = sagaArgs
  const { viewModelName, aggregateIds, aggregateArgs } = action

  const connectionId = `${getHash(action.aggregateIds)}${getHash(
    action.aggregateArgs
  )}`

  if (!skipConnectionManager) {
    const { addedConnections } = connectionManager.addConnection({
      connectionName: viewModelName,
      connectionId
    })

    if (addedConnections.length !== 1) {
      return
    }
  }

  yield* sagaManager.stop(`${DISCONNECT_VIEWMODEL}${sagaKey}`)

  const viewModel = viewModels.find(
    ({ name }: { name: string }) => name === viewModelName
  )

  const eventTypes = Object.keys(viewModel.projection).filter(
    eventType => eventType !== 'Init'
  )

  // viewModelName + aggregateIds => Array<{ aggregateId, eventType }>
  let subscriptionKeys = eventTypes.reduce((acc, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [] as any[])

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscribeTopicRequest(eventType, aggregateId))
    }

    while (counter > 0) {
      // eslint-disable-next-line no-loop-func
      const subscribeResultAction = yield take((action: any): any => {
        return (
          (action.type === SUBSCRIBE_TOPIC_SUCCESS ||
            action.type === SUBSCRIBE_TOPIC_FAILURE) &&
          subscriptionKeys.find(
            key =>
              key.aggregateId === action.topicId &&
              key.eventType === action.topicName
          )
        )
      })

      if (subscribeResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === subscribeResultAction.topicId &&
              key.eventType === subscribeResultAction.topicName
            )
        )
      }

      counter--
    }
  }

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    {
      ...sagaArgs,
      eventTypes
    },
    action
  )

  while (true) {
    yield put(queryViewModelRequest(viewModelName, aggregateIds, aggregateArgs))

    const loadViewModelStateResultAction = yield take(
      (action: any): any =>
        (action.type === QUERY_VIEWMODEL_SUCCESS ||
          action.type === QUERY_VIEWMODEL_FAILURE) &&
        action.viewModelName === viewModelName &&
        `${getHash(action.aggregateIds)}${getHash(action.aggregateArgs)}` ===
          connectionId
    )

    if (loadViewModelStateResultAction.type === QUERY_VIEWMODEL_SUCCESS) {
      break
    }

    if (
      loadViewModelStateResultAction.type === QUERY_VIEWMODEL_FAILURE &&
      loadViewModelStateResultAction.error instanceof HttpError
    ) {
      // eslint-disable-next-line no-console
      console.warn('Http error: ', loadViewModelStateResultAction.error)
      return
    }

    yield delay(500)
  }
}

export default connectViewModelSaga
