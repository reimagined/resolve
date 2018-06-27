import { fork, takeEvery } from 'redux-saga/effects'

import {
  LOAD_VIEWMODEL_STATE_REQUEST,
  SEND_COMMAND_REQUEST
} from './action_types'
import loadViewModelStateSaga from './load_view_model_state_saga'
import sendCommandSaga from './send_command_saga'
import viewModelSaga from './view_models_saga'
import subscribeSaga from './subscribe_saga'

function* rootSaga(sagaArgs) {
  yield fork(subscribeSaga, sagaArgs)
  yield takeEvery(
    LOAD_VIEWMODEL_STATE_REQUEST,
    loadViewModelStateSaga,
    sagaArgs
  )
  yield takeEvery(SEND_COMMAND_REQUEST, sendCommandSaga, sagaArgs)
  yield fork(viewModelSaga, sagaArgs)
}

export default rootSaga

// viewModels,
// readModels,
// aggregates,
// subscribeAdapter,
// origin,
// rootPath
