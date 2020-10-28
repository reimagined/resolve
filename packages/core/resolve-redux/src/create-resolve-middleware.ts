import { Middleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { getClient, Context } from 'resolve-client'

import rootSaga from './root-saga'

type MiddlewareContext = {
  store: any
  resolveContext: Context
  customSagas: any[]
  sessionId: string
}

const emptySaga = function* () {
  /* empty */
}

const wrapSagaMiddleware = (sagaMiddleware: any): any => {
  const run = (isClient: boolean, context: MiddlewareContext): void => {
    const client = getClient(context.resolveContext)
    const queryIdMap = new Map()

    const backCompatibleArgs = {
      ...context,
      ...context.resolveContext,
    }

    delete backCompatibleArgs.resolveContext

    sagaMiddleware.run(isClient ? rootSaga : emptySaga, {
      ...backCompatibleArgs,
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
  run: (isClient: boolean, args: MiddlewareContext) => any
} => wrapSagaMiddleware(createSagaMiddleware())

export default createResolveMiddleware
