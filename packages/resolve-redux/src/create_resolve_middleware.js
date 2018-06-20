import createSagaMiddleware from 'redux-saga'

import rootSaga from './root_saga'
import emptySaga from './empty_saga'

const createResolveMiddleware = () => {
  const sagaMiddleware = createSagaMiddleware()

  const sagaMiddlewareRun = sagaMiddleware.run.bind(sagaMiddleware)
  sagaMiddleware.run = sagaArgs => {
    sagaMiddlewareRun(sagaArgs.isClient ? rootSaga : emptySaga, sagaArgs)
  }

  return sagaMiddleware
}

export default createResolveMiddleware
