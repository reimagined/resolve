/*
import { take, put, delay } from 'redux-saga/effects'

import getHash from '../get_hash'
import { queryReadModelRequest } from './actions'
import {
  DISCONNECT_READMODEL,
  QUERY_READMODEL_FAILURE,
  QUERY_READMODEL_SUCCESS
} from '../action-types'

import { HttpError } from '../create_api'
import { generateQueryId } from '../helpers'
*/

/*
  Saga is launched on action `CONNECT_READMODEL`, emitted by read model connector.
  If read model with supposed options had already been fetched, do nothing.
  Saga performs resolver result fetching and subscribes to diff topic.
  Resolver result is fetched by `load_read_model_state_saga`, interaction
  performs through following actions: `LOAD_READMODEL_STATE_REQUEST`,
  `LOAD_READMODEL_STATE_SUCCESS` and `LOAD_READMODEL_STATE_FAILURE`.
*/

/*
const connectReadModelSaga = function*(sagaArgs: any, action: any): any {
  const {
    connectionManager,
    sagaManager,
    sagaKey
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

  // TODO: something wrong with types here
  const queryId = hash(
    `${key}${queryIdMap.get(key)}${sessionId}` as any,
    '00000000-0000-0000-0000-000000000000' as any
  )
  const queryId = generateQueryId(readModelName, resolverName)

  while (true) {
    yield put(
      queryReadModelRequest(readModelName, resolverName, resolverArgs)
    )

    const loadReadModelStateResultAction = yield take(
      (action: any) =>
        (action.type === QUERY_READMODEL_SUCCESS ||
          action.type === QUERY_READMODEL_FAILURE) &&
        action.queryId === queryId
    )

    if (loadReadModelStateResultAction.type === QUERY_READMODEL_SUCCESS) {
      break
    }

    if (
      loadReadModelStateResultAction.type === QUERY_READMODEL_FAILURE &&
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
*/
