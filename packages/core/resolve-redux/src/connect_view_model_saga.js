import { take, put, delay } from 'redux-saga/effects'

import getHash from './get_hash'
import { loadViewModelStateRequest } from './actions'
import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  LOAD_VIEWMODEL_STATE_FAILURE,
  LOAD_VIEWMODEL_STATE_SUCCESS
} from './action_types'
import eventInjectSaga from './event_inject_saga'
import { HttpError } from './create_api'

const connectViewModelSaga = function*(sagaArgs, action) {
  const { connectionManager, sagaManager, sagaKey } = sagaArgs
  const {
    viewModelName,
    aggregateIds,
    aggregateArgs,
    skipConnectionManager
  } = action

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

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventInjectSaga,
    sagaArgs,
    action
  )

  while (true) {
    yield put(
      loadViewModelStateRequest(viewModelName, aggregateIds, aggregateArgs)
    )

    const loadViewModelStateResultAction = yield take(
      action =>
        (action.type === LOAD_VIEWMODEL_STATE_SUCCESS ||
          action.type === LOAD_VIEWMODEL_STATE_FAILURE) &&
        action.viewModelName === viewModelName &&
        `${getHash(action.aggregateIds)}${getHash(action.aggregateArgs)}` ===
          connectionId
    )

    if (loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_SUCCESS) {
      break
    }

    if (
      loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_FAILURE &&
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
