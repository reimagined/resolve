import { take, put } from 'redux-saga/effects'
import { delay } from 'redux-saga'

import getHash from './get_hash'
import eventListenerSaga from './event_listener_saga'
import { subscribeTopicRequest, loadViewModelStateRequest } from './actions'
import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  LOAD_VIEWMODEL_STATE_FAILURE,
  LOAD_VIEWMODEL_STATE_SUCCESS
} from './action_types'
import { HttpError } from './create_api'

const connectViewModelSaga = function*(sagaArgs, action) {
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

  const viewModel = viewModels.find(({ name }) => name === viewModelName)

  const eventTypes = Object.keys(viewModel.projection)

  // viewModelName + aggregateIds => Array<{ aggregateId, eventType }>
  let subscriptionKeys = eventTypes.reduce((acc, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [])

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    {
      ...sagaArgs,
      eventTypes
    },
    action
  )

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscribeTopicRequest(eventType, aggregateId))
    }

    while (counter > 0) {
      const subscribeResultAction = yield take(action => {
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

  while (true) {
    yield put(
      loadViewModelStateRequest(viewModelName, aggregateIds, aggregateArgs)
    )

    const loadViewModelStateResultAction = yield take(
      action =>
        (action.type === LOAD_VIEWMODEL_STATE_SUCCESS ||
          action.type === LOAD_VIEWMODEL_STATE_FAILURE) &&
        (action.viewModelName === viewModelName &&
          `${getHash(action.aggregateIds)}${getHash(action.aggregateArgs)}` ===
            connectionId)
    )

    if (loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_SUCCESS) {
      break
    }

    if (
      loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_FAILURE &&
      loadViewModelStateResultAction.error instanceof HttpError
    ) {
      console.warn('Http error: ', loadViewModelStateResultAction.error)
      return
    }

    yield delay(500)
  }
}

export default connectViewModelSaga
