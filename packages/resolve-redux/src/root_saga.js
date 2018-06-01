import { fork } from 'redux-saga/effects'

import viewModelSaga from './view_models_saga'
import mqttSaga from './mqtt_saga'

function* rootSaga(sagaArgs) {
  yield fork(viewModelSaga, sagaArgs)
  yield fork(mqttSaga, sagaArgs)
}

export default rootSaga

// viewModels,
// readModels,
// aggregates,
// subscribeAdapter,
// origin,
// rootPath
