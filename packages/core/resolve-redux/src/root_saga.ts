import { fork, takeEvery } from 'redux-saga/effects'

import {
  QUERY_VIEWMODEL_REQUEST,
  //  QUERY_READMODEL_REQUEST,
  SEND_COMMAND_REQUEST,
  AUTH_REQUEST,
  LOGOUT
} from './action-types'
//import loadViewModelStateSaga from './load_view_model_state_saga'
//import loadReadModelStateSaga from './read-model/load_read_model_state_saga'
import sendCommandSaga from './command/send-command-saga'
import viewModelSaga from './view-model/view-models-saga'
import readModelSaga from './read-model/read-models-saga'
import commandSaga from './command/command-saga'
import subscribeSaga from './view-model/subscribe-saga'
import authSaga from './auth_saga'
import logoutSaga from './logout_saga'
import { RootSagaArgs } from './types'

function* rootSaga({ customSagas, ...sagaArgs }: RootSagaArgs): any {
  //yield fork(subscribeSaga, sagaArgs)

  //yield takeEvery(
  //    LOAD_VIEWMODEL_STATE_REQUEST,
  //  loadViewModelStateSaga,
  //sagaArgs
  //)
  //yield takeEvery(QUERY_READMODEL_REQUEST, loadReadModelStateSaga, sagaArgs)
  //yield takeEvery(SEND_COMMAND_REQUEST, sendCommandSaga, sagaArgs)

  //yield takeEvery(AUTH_REQUEST, authSaga, sagaArgs)
  //yield takeEvery(LOGOUT, logoutSaga)
  //yield fork(viewModelSaga, sagaArgs)
  yield fork(commandSaga, sagaArgs)
  yield fork(readModelSaga, sagaArgs)

  for (const customSaga of customSagas) {
    yield fork(customSaga, sagaArgs)
  }
}

export default rootSaga
