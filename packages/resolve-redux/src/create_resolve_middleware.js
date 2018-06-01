import createSagaMiddleware from 'redux-saga'

import rootSaga from './root_saga'

const createResolveMiddleware = ({ isClient, ...sagaArgs }) => {
  const saga = isClient ? rootSaga : function*() {}

  const sagaMiddleware = createSagaMiddleware()

  const sagaMiddlewareRun = sagaMiddleware.run.bind(sagaMiddleware)
  sagaMiddleware.run = (...args) => {
    sagaMiddlewareRun(saga, {
      ...args,
      sagaArgs
    })
  }

  return sagaMiddleware
}

export default createResolveMiddleware
