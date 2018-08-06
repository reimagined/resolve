import { take, put, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import hash from 'uuid'

import getHash from './get_hash'
import diffListenerSaga from './diff_listener_saga'
import unsubscribeReadModelTopicsSaga from './unsubscribe_read_model_topics_saga'
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
import { HttpError } from './create_api'

/*
  Saga is launched on action `CONNECT_READMODEL`, emitted by read model connector.
  If read model with supposed options had already been fetched, do nothing.
  Saga performs resolver result fetching and subscribes to diff topic.
  If read model is reactive, it launches `diff_listener_saga`.
  Saga ends when resolver result is fetched and diff topic is acknowledged.
  Resolver result is fetched by `load_read_model_state_saga`, interaction
  performs through following actions: `LOAD_READMODEL_STATE_REQUEST`,
  `LOAD_READMODEL_STATE_SUCCESS` and `LOAD_READMODEL_STATE_FAILURE`.
  Subscription to diff topic is performed by `subscribe_saga`, interaction
  performs by following actions: `SUBSCRIBE_TOPIC_REQUEST`,
  `SUBSCRIBE_TOPIC_SUCCESS` and `SUBSCRIBE_TOPIC_FAILURE`.
  If read model is reactive, saga suspends itself after `timeToLive` ms
  and emits new `CONNECT_READMODEL` action to reconnect.
*/

const connectReadModelSaga = function*(sagaArgs, action) {
  const {
    connectionManager,
    sagaManager,
    sagaKey,
    queryIdMap,
    sessionId,
    store
  } = sagaArgs
  const {
    readModelName,
    resolverName,
    resolverArgs,
    isReactive,
    skipConnectionManager
  } = action

  if (!skipConnectionManager) {
    const { addedConnections } = connectionManager.addConnection({
      connectionName: readModelName,
      connectionId: `${getHash(action.resolverName)}${getHash(
        action.resolverArgs
      )}`
    })

    if (addedConnections.length !== 1) {
      return
    }
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
        isReactive,
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
        yield delay(loadReadModelStateResultAction.timeToLive)

        yield* unsubscribeReadModelTopicsSaga({ queryId })

        yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`, () =>
          store.dispatch({
            ...action,
            skipConnectionManager: true
          })
        )
      })

      break
    }

    if (
      loadReadModelStateResultAction.type === LOAD_READMODEL_STATE_FAILURE &&
      loadReadModelStateResultAction.error instanceof HttpError
    ) {
      // eslint-disable-next-line no-console
      console.warn('Http error: ', loadReadModelStateResultAction.error)
      return
    }

    yield delay(500)
  }
}

export default connectReadModelSaga
