import { take } from 'redux-saga/effects'

import getHash from './get_hash'
import createConnectionManager from './create_connection_manager'
import createSagaManager from './create_saga_manager'
import { CONNECT_READMODEL, DISCONNECT_READMODEL } from './action_types'
import connectReadModelSaga from './connect_read_model_saga'
import disconnectReadModelSaga from './disconnect_read_model_saga'

const readModelsSaga = function*(sagaArgs) {
  const connectionManager = createConnectionManager({ wildcardSymbol: null })
  const sagaManager = createSagaManager()

  while (true) {
    const action = yield take([CONNECT_READMODEL, DISCONNECT_READMODEL])

    switch (action.type) {
      case CONNECT_READMODEL: {
        const { readModelName, resolverName, resolverArgs } = action
        const sagaKey = getHash({
          readModelName,
          resolverName,
          resolverArgs
        })
        yield* sagaManager.start(
          `${CONNECT_READMODEL}${sagaKey}`,
          connectReadModelSaga,
          {
            ...sagaArgs,
            connectionManager,
            sagaManager,
            sagaKey
          },
          action
        )
        break
      }
      case DISCONNECT_READMODEL: {
        const { readModelName, resolverName, resolverArgs } = action
        const sagaKey = getHash({
          readModelName,
          resolverName,
          resolverArgs
        })
        yield* sagaManager.start(
          `${DISCONNECT_READMODEL}${sagaKey}`,
          disconnectReadModelSaga,
          {
            ...sagaArgs,
            connectionManager,
            sagaManager,
            sagaKey
          },
          action
        )
        break
      }
      default:
    }
  }
}

export default readModelsSaga
