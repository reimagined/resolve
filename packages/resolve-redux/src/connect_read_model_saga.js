import { take, put, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import hash from 'uuid'

import getHash from './get_hash'
import diffListenerSaga from './diff_listener_saga'
import { subscribeTopicRequest, loadReadModelStateRequest } from './actions'
import {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  LOAD_READMODEL_STATE_FAILURE,
  LOAD_READMODEL_STATE_SUCCESS
} from './action_types'

import { diffTopicName, namespace } from './constants'

const connectReadModelSaga = function*(sagaArgs, action) {
  const {
    connectionManager,
    sagaManager,
    sagaKey,
    queryIdMap,
    sessionId
  } = sagaArgs
  const { readModelName, resolverName, resolverArgs, isReactive } = action

  const { addedConnections } = connectionManager.addConnection({
    connectionName: readModelName,
    connectionId: `${getHash(action.resolverName)}${getHash(
      action.resolverArgs
    )}`
  })

  if (addedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${DISCONNECT_READMODEL}${sagaKey}`)

  const key = `${readModelName}${getHash(action.resolverName)}${getHash(
    action.resolverArgs
  )}`
  if (!queryIdMap.has(key)) {
    queryIdMap.set(key, 0)
  }
  queryIdMap.set(key, queryIdMap.get(key) + 1)

  const queryId = hash(`${key}${queryIdMap.get(key)}${sessionId}`, namespace)

  if (isReactive) {
    yield* sagaManager.start(
      `${CONNECT_READMODEL}${sagaKey}`,
      diffListenerSaga,
      {
        ...sagaArgs,
        queryId
      },
      action
    )

    while (true) {
      yield put(subscribeTopicRequest(diffTopicName, queryId))

      const subscribeResultAction = yield take(action => {
        return (
          (action.type === SUBSCRIBE_TOPIC_SUCCESS ||
            action.type === SUBSCRIBE_TOPIC_FAILURE) &&
          diffTopicName === action.topicName &&
          queryId === action.topicId
        )
      })

      if (subscribeResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
        break
      }
    }
  }

  while (true) {
    yield put(
      loadReadModelStateRequest(
        readModelName,
        resolverName,
        resolverArgs,
        queryId
      )
    )

    const loadReadModelStateResultAction = yield take(
      action =>
        (action.type === LOAD_READMODEL_STATE_SUCCESS ||
          action.type === LOAD_READMODEL_STATE_FAILURE) &&
        action.queryId === queryId
    )

    if (loadReadModelStateResultAction.type === LOAD_READMODEL_STATE_SUCCESS) {
      yield fork(function*() {
        yield delay(action.timeToLive)
        yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`)
        yield put(action)
      })

      break
    }
  }
}

export default connectReadModelSaga
