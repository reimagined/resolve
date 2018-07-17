import createSagaMiddleware from 'redux-saga'

import rootSaga from './root_saga'
import emptySaga from './empty_saga'
import createApi from './create_api'

const createResolveMiddleware = () => {
  const sagaMiddleware = createSagaMiddleware()

  let sagaMiddlewareRun = sagaMiddleware.run.bind(sagaMiddleware)

  const sagaRunInternal = sagaArgs => {
    const api = createApi(sagaArgs)
    const queryIdMap = new Map()

    sagaMiddlewareRun(sagaArgs.isClient ? rootSaga : emptySaga, {
      ...sagaArgs,
      queryIdMap,
      api
    })
  }

  Object.defineProperty(sagaMiddleware, 'run', {
    get: () => sagaRunInternal,
    set: value => (sagaMiddlewareRun = value.bind(sagaMiddleware))
  })

  return sagaMiddleware
}

export default createResolveMiddleware
