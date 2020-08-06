import { put } from 'redux-saga/effects'

import getHash from '../get-hash'
import { dropViewModelState } from './actions'
import { CONNECT_VIEWMODEL } from '../action-types'
import unsubscribeViewModelTopicsSaga from './unsubscribe-view-model-topics-saga'

const disconnectViewModelSaga = function*(sagaArgs: any, action: any): any {
  const { viewModels, connectionManager, sagaManager, sagaKey } = sagaArgs

  const { viewModelName, aggregateIds, aggregateArgs } = action

  const connectionId = `${getHash(aggregateIds)}${getHash(aggregateArgs)}`

  const { removedConnections } = connectionManager.removeConnection({
    connectionName: viewModelName,
    connectionId
  })
  if (removedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`)

  yield put(dropViewModelState(viewModelName, aggregateIds, aggregateArgs))

  yield* unsubscribeViewModelTopicsSaga({
    viewModels,
    viewModelName,
    aggregateIds
  })
}

export default disconnectViewModelSaga
