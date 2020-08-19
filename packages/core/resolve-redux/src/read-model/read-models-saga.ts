import { take } from 'redux-saga/effects'

import getHash from '../get-hash'
import createSagaManager from '../create_saga_manager'
import { CONNECT_READMODEL, DISCONNECT_READMODEL } from '../action-types'
import connectReadModelSaga from './connect-read-model-saga'
import disconnectReadModelSaga from './disconnect-read-model-saga'
import { ChildSagaArgs } from '../types'
import { ConnectReadModelAction, DisconnectReadModelAction } from './actions'

const readModelsSaga = function*(sagaArgs: ChildSagaArgs): any {
  const sagaManager = createSagaManager()

  while (true) {
    const action:
      | ConnectReadModelAction
      | DisconnectReadModelAction = yield take([
      CONNECT_READMODEL,
      DISCONNECT_READMODEL
    ])

    switch (action.type) {
      case CONNECT_READMODEL: {
        const { query } = action
        const sagaKey = getHash(query)
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
        const { query } = action
        const sagaKey = getHash(query)
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
