import { take, put, delay } from 'redux-saga/effects'
import hash from 'uuid'

import getHash from './get_hash'
import { loadReadModelStateRequest } from './actions'
import {
  DISCONNECT_READMODEL,
  LOAD_READMODEL_STATE_FAILURE,
  LOAD_READMODEL_STATE_SUCCESS
} from './action_types'

import { HttpError } from './create_api'

/*
  Saga is launched on action `CONNECT_READMODEL`, emitted by read model connector.
  If read model with supposed options had already been fetched, do nothing.
  Saga performs resolver result fetching and subscribes to diff topic.
  Resolver result is fetched by `load_read_model_state_saga`, interaction
  performs through following actions: `LOAD_READMODEL_STATE_REQUEST`,
  `LOAD_READMODEL_STATE_SUCCESS` and `LOAD_READMODEL_STATE_FAILURE`.
*/

const connectReadModelSaga = function*(sagaArgs, action) {
  const {
    connectionManager,
    sagaManager,
    sagaKey,
    queryIdMap,
    sessionId
  } = sagaArgs
  const {
    readModelName,
    resolverName,
    resolverArgs,
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

  const queryId = hash(
    `${key}${queryIdMap.get(key)}${sessionId}`,
    '00000000-0000-0000-0000-000000000000'
  )

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
