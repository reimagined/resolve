import { take } from 'redux-saga/effects'

import getHash from '../get-hash'
import createConnectionManager from '../create_connection_manager'
import createSagaManager from '../create_saga_manager'
import { CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL } from '../action-types'
import connectViewModelSaga from './connect-view-model-saga'
import disconnectViewModelSaga from './disconnect-view-model-saga'

const viewModelsSaga = function*(sagaArgs: any): any {
  const connectionManager = createConnectionManager({ wildcardSymbol: null })
  const sagaManager = createSagaManager()

  while (true) {
    const action = yield take([CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL])

    switch (action.type) {
      case CONNECT_VIEWMODEL: {
        const { viewModelName, aggregateIds, aggregateArgs } = action
        const sagaKey = getHash({
          viewModelName,
          aggregateIds,
          aggregateArgs
        })
        yield* sagaManager.start(
          `${CONNECT_VIEWMODEL}${sagaKey}`,
          connectViewModelSaga,
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
      case DISCONNECT_VIEWMODEL: {
        const { viewModelName, aggregateIds, aggregateArgs } = action
        const sagaKey = getHash({
          viewModelName,
          aggregateIds,
          aggregateArgs
        })
        yield* sagaManager.start(
          `${DISCONNECT_VIEWMODEL}${sagaKey}`,
          disconnectViewModelSaga,
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

export default viewModelsSaga
