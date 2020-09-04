import { fork } from 'redux-saga/effects'

import viewModelSaga from './view-model/view-models-saga'
import readModelSaga from './read-model/read-models-saga'
import commandSaga from './command/command-saga'
import { RootSagaArgs } from './types'

function* rootSaga({ customSagas, ...sagaArgs }: RootSagaArgs): any {
  yield fork(viewModelSaga, sagaArgs)
  yield fork(commandSaga, sagaArgs)
  yield fork(readModelSaga, sagaArgs)

  for (const customSaga of customSagas) {
    yield fork(customSaga, sagaArgs)
  }
}

export default rootSaga
