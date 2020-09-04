import { Middleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { getClient } from 'resolve-client'

import rootSaga from './root-saga'

type MiddlewareContext = {
  store: any
  viewModels: any[]
  origin: any
  rootPath: any
  staticPath: any
  sessionId: any
  jwtProvider: any
  isClient: boolean
  customSagas: any[]
  queryMethod: string
}

const emptySaga = function* () {
  /* empty */
}

const wrapSagaMiddleware = (sagaMiddleware: any): any => {
  const run = (context: MiddlewareContext): void => {
    const client = getClient(context)
    const queryIdMap = new Map()

    sagaMiddleware.run(context.isClient ? rootSaga : emptySaga, {
      ...context,
      queryIdMap,
      client,
    })
  }

  const middleware = (...args: any[]): any => sagaMiddleware(...args)
  Object.defineProperty(middleware, 'run', {
    get: () => run,
  })
  return middleware
}

const createResolveMiddleware = (): Middleware & {
  run: (args: MiddlewareContext) => any
} => wrapSagaMiddleware(createSagaMiddleware())

export default createResolveMiddleware
