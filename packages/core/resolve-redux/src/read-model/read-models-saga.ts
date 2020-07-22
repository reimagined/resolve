import { take } from 'redux-saga/effects'

import getHash from '../get-hash'
import createSagaManager from '../create_saga_manager'
import { CONNECT_READMODEL, DISCONNECT_READMODEL } from '../action-types'
import connectReadModelSaga from './connect-read-model-saga'
import disconnectReadModelSaga from './disconnect-read-model-saga'
import { RootSagaArgs } from '../types'

const readModelsSaga = function*(sagaArgs: RootSagaArgs): any {
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
