import { take } from 'redux-saga/effects'

import getHash from '../get-hash'
import createConnectionManager from '../create_connection_manager'
import createSagaManager from '../create_saga_manager'
import { CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL } from '../action-types'
import connectViewModelSaga from './connect-view-model-saga'
import disconnectViewModelSaga from './disconnect-view-model-saga'
import { ConnectViewModelAction, DisconnectViewModelAction } from './actions'

const viewModelsSaga = function*(sagaArgs: any): any {
  const sagaManager = createSagaManager()

  while (true) {
    const action:
      | ConnectViewModelAction
      | DisconnectViewModelAction = yield take([
      CONNECT_VIEWMODEL,
      DISCONNECT_VIEWMODEL
    ])

    switch (action.type) {
      case CONNECT_VIEWMODEL: {
        const { query } = action
        const sagaKey = getHash(query)
        yield* sagaManager.start(
          `${CONNECT_VIEWMODEL}${sagaKey}`,
          connectViewModelSaga,
          {
            ...sagaArgs,
            sagaManager,
            sagaKey
          },
          action
        )
        break
      }
      case DISCONNECT_VIEWMODEL: {
        const { query } = action
        const sagaKey = getHash(query)
        yield* sagaManager.start(
          `${DISCONNECT_VIEWMODEL}${sagaKey}`,
          disconnectViewModelSaga,
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

export default viewModelsSaga
