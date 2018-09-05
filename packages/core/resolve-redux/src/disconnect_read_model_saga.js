import { put } from 'redux-saga/effects'

import getHash from './get_hash'
import { dropReadModelState } from './actions'
import { CONNECT_READMODEL } from './action_types'

const disconnectReadModelSaga = function*(sagaArgs, action) {
  const { connectionManager, sagaManager, sagaKey } = sagaArgs

  const { readModelName, resolverName, resolverArgs } = action

  const connectionId = `${getHash(resolverName)}${getHash(resolverArgs)}`

  const { removedConnections } = connectionManager.removeConnection({
    connectionName: readModelName,
    connectionId
  })
  if (removedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`)

  yield put(dropReadModelState(readModelName, resolverName, resolverArgs))
}

export default disconnectReadModelSaga
