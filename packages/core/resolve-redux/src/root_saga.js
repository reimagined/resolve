import { fork, takeEvery } from 'redux-saga/effects'

import {
  LOAD_VIEWMODEL_STATE_REQUEST,
  LOAD_READMODEL_STATE_REQUEST,
  SEND_COMMAND_REQUEST,
  STOP_READ_MODEL_SUBSCRIPTION_REQUEST
} from './action_types'
import loadViewModelStateSaga from './load_view_model_state_saga'
import loadReadModelStateSaga from './load_read_model_state_saga'
import sendCommandSaga from './send_command_saga'
import viewModelSaga from './view_models_saga'
import readModelSaga from './read_models_saga'
import subscribeSaga from './subscribe_saga'
import stopReadModelSubscriptionSaga from './stop_read_model_subscription_saga'

function* rootSaga(sagaArgs) {
  yield fork(subscribeSaga, sagaArgs)
  yield takeEvery(
    LOAD_VIEWMODEL_STATE_REQUEST,
    loadViewModelStateSaga,
    sagaArgs
  )
  yield takeEvery(
    LOAD_READMODEL_STATE_REQUEST,
    loadReadModelStateSaga,
    sagaArgs
  )
  yield takeEvery(SEND_COMMAND_REQUEST, sendCommandSaga, sagaArgs)
  yield takeEvery(
    STOP_READ_MODEL_SUBSCRIPTION_REQUEST,
    stopReadModelSubscriptionSaga,
    sagaArgs
  )
  yield fork(viewModelSaga, sagaArgs)
  yield fork(readModelSaga, sagaArgs)
}

export default rootSaga
