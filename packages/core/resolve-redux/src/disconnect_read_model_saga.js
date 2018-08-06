import { take, put } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import hash from 'uuid/v3'

import getHash from './get_hash'
import { dropReadModelState, stopReadModelSubscriptionRequest } from './actions'
import {
  CONNECT_READMODEL,
  STOP_READ_MODEL_SUBSCRIPTION_SUCCESS,
  STOP_READ_MODEL_SUBSCRIPTION_FAILURE
} from './action_types'
import { namespace } from './constants'
import unsubscribeReadModelTopicsSaga from './unsubscribe_read_model_topics_saga'
import { HttpError } from './create_api'

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

  yield* unsubscribeReadModelTopicsSaga({ queryId })

  while (true) {
    yield put(
      stopReadModelSubscriptionRequest(readModelName, resolverName, queryId)
    )

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

    if (
      stopSubscriptionResultAction.type ===
        STOP_READ_MODEL_SUBSCRIPTION_FAILURE &&
      stopSubscriptionResultAction.error instanceof HttpError
    ) {
      // eslint-disable-next-line no-console
      console.warn('Http error: ', stopSubscriptionResultAction.error)
      return
    }

    yield delay(500)
  }
}

export default disconnectReadModelSaga
