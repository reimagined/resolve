import { fork, cancel, takeLatest } from 'redux-saga/effects'
import createConnectionManager from './connection_manager'
import takeLatestConditional from './take_latest_conditional'
import stringify from 'json-stable-stringify'

import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  SUBSCRIBE_TOPIC_FAILURE,
  SUBSCRIBE_TOPIC_SUCCESS
} from './action_types'
import connectViewModelSaga from './connect_view_model_saga'
import disconnectViewModelSaga from './disconnect_view_model_saga'
import { loadViewModelStateRequest } from './actions'

/*
type: CONNECT_VIEWMODEL,
viewModelName,
aggregateIds
 */

const viewModelsSaga = function*(sagaArgs) {
  const connectionManager = createConnectionManager({ wildcardSymbol: null })
  const connectionSagas = {}
  const disconnectionSagas = {}

  while (true) {
    const action = yield take([CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL])

    switch (action.type) {
      case CONNECT_VIEWMODEL: {
        const sagaOptions = {
          connectionSagas,
          disconnectionSagas,
          connectionManager,
          ...sagaArgs
        }
        const boundConnectViewModelSaga = connectViewModelSaga.bind(
          null,
          sagaOptions
        )
        sagaOptions.sagaId = yield fork(boundConnectViewModelSaga)
        break
      }
      case DISCONNECT_VIEWMODEL: {
        const sagaOptions = {
          connectionSagas,
          disconnectionSagas,
          connectionManager,
          ...sagaArgs
        }
        //TODO
        const boundDisconnectViewModelSaga = disconnectViewModelSaga.bind(
          null,
          sagaOptions
        )
        sagaOptions.sagaId = yield fork(boundDisconnectViewModelSaga)
        break
      }
      default:
    }
  }
}

export default viewModelsSaga
