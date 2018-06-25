import { fork, takeEvery } from 'redux-saga/effects'

import { LOAD_VIEWMODEL_STATE_REQUEST } from './action_types'
import loadViewModelStateSaga from './load_view_model_state_saga'
import viewModelSaga from './view_models_saga'
import subscribeSaga from './subscribe_saga'

function* rootSaga(sagaArgs) {
  yield takeEvery(
    LOAD_VIEWMODEL_STATE_REQUEST,
    loadViewModelStateSaga,
    sagaArgs
  )
  yield fork(viewModelSaga, sagaArgs)
  yield fork(subscribeSaga, sagaArgs)
}

export default rootSaga

// viewModels,
// readModels,
// aggregates,
// subscribeAdapter,
// origin,
// rootPath
