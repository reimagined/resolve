import { put } from 'redux-saga/effects'

import getHash from './get_hash'
import { dropViewModelState } from './actions'
import { CONNECT_VIEWMODEL } from './action_types'

const disconnectViewModelSaga = function*(sagaArgs, action) {
  const { connectionManager, sagaManager, sagaKey } = sagaArgs

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
}

export default disconnectViewModelSaga
