import { take } from 'redux-saga/effects'
import stringify from 'json-stable-stringify'

import createConnectionManager from './create_connection_manager'
import createSagaManager from './create_saga_manager'

import { CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL } from './action_types'
import connectViewModelSaga from './connect_view_model_saga'
import disconnectViewModelSaga from './disconnect_view_model_saga'

const viewModelsSaga = function*(sagaArgs) {
  const connectionManager = createConnectionManager({ wildcardSymbol: null })
  const sagaManager = createSagaManager()

  while (true) {
    const action = yield take([CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL])

    switch (action.type) {
      case CONNECT_VIEWMODEL: {
        const { viewModelName, aggregateIds, aggregateArgs } = action
        const sagaKey = stringify({
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
          }
        )
        break
      }
      case DISCONNECT_VIEWMODEL: {
        const { viewModelName, aggregateIds, aggregateArgs } = action
        const sagaKey = stringify({
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
          }
        )
        break
      }
      default:
    }
  }
}

export default viewModelsSaga
