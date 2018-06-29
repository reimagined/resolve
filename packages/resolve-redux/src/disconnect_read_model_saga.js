import { take, put } from 'redux-saga/effects'
import hash from 'uuid/v3'

import getHash from './get_hash'
import {
  unsubscibeTopicRequest,
  dropReadModelState,
  stopReadModelSubscriptionRequest
} from './actions'
import {
  UNSUBSCRIBE_TOPIC_SUCCESS,
  UNSUBSCRIBE_TOPIC_FAILURE,
  CONNECT_READMODEL,
  STOP_READ_MODEL_SUBSCRIPTION_SUCCESS,
  STOP_READ_MODEL_SUBSCRIPTION_FAILURE
} from './action_types'

import { diffTopicName, namespace } from './constants'

const disconnectReadModelSaga = function*(sagaArgs, action) {
  const {
    connectionManager,
    sagaManager,
    sagaKey,
    queryIdMap,
    sessionId
  } = sagaArgs

  const { readModelName, resolverName, resolverArgs, isReactive } = action

  const connectionId = `${getHash(resolverName)}${getHash(resolverArgs)}`

  const { removedConnections } = connectionManager.removeConnection({
    connectionName: readModelName,
    connectionId
  })
  if (removedConnections.length !== 1) {
    return
  }

  const key = `${readModelName}${getHash(action.resolverName)}${getHash(
    action.resolverArgs
  )}`

  const queryId = hash(`${key}${queryIdMap.get(key)}${sessionId}`, namespace)

  yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`)

  yield put(dropReadModelState(readModelName, resolverName, resolverArgs))

  if (!isReactive) {
    return
  }

  while (true) {
    yield put(unsubscibeTopicRequest(diffTopicName, queryId))

    const unsubscribeResultAction = yield take(
      action =>
        (action.type === UNSUBSCRIBE_TOPIC_SUCCESS ||
          action.type === UNSUBSCRIBE_TOPIC_FAILURE) &&
        diffTopicName === action.topicName &&
        queryId === action.topicId
    )

    if (unsubscribeResultAction.type === UNSUBSCRIBE_TOPIC_SUCCESS) {
      break
    }
  }

  while (true) {
    yield put(stopReadModelSubscriptionRequest(queryId))

    const stopSubscriptionResultAction = yield take(
      action =>
        (action.type === STOP_READ_MODEL_SUBSCRIPTION_SUCCESS ||
          action.type === STOP_READ_MODEL_SUBSCRIPTION_FAILURE) &&
        queryId === action.topicId
    )

    if (
      stopSubscriptionResultAction.type === STOP_READ_MODEL_SUBSCRIPTION_SUCCESS
    ) {
      break
    }
  }
}

export default disconnectReadModelSaga
