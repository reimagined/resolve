import {
  createStore,
  applyMiddleware,
  combineReducers,
  compose,
  Reducer,
  Middleware,
  StoreEnhancer,
  Store,
} from 'redux'
import { Saga } from 'redux-saga'
import uuid from 'uuid/v4'
import { Context } from 'resolve-client'

import { reducer as viewModelReducer } from './view-model/view-model-reducer'
import { reducer as readModelReducer } from './read-model/read-model-reducer'
import createResolveMiddleware from './create-resolve-middleware'
import deserializeInitialState from './internal/deserialize-initial-state'

type ResolveRedux = {
  reducers?: {
    [key: string]: Reducer
  }
  middlewares?: Middleware[]
  enhancers?: StoreEnhancer<any, any>[]
}

type ResolveStoreParameters = {
  redux: ResolveRedux
  initialState?: any
  serializedState?: string
  customSagas?: Saga[]
}

const createResolveStore = (
  resolveContext: Context,
  params: ResolveStoreParameters,
  isClient = true
): Store => {
  const sessionId = uuid()
  const { viewModels } = resolveContext
  const {
    initialState,
    serializedState,
    redux: { reducers = [], middlewares = [], enhancers = [] },
    customSagas = [],
  } = params

  if (serializedState != null && initialState != null) {
    throw Error(
      `ambiguous initial state: both initialState and serializedState are set`
    )
  }

  let actualInitialState

  if (serializedState != null) {
    actualInitialState = deserializeInitialState(viewModels, serializedState)
  } else {
    actualInitialState = initialState
  }

  const combinedReducers = combineReducers({
    ...reducers,
    viewModels: viewModelReducer,
    readModels: readModelReducer,
  })

  const resolveMiddleware = createResolveMiddleware()
  const appliedMiddlewares = applyMiddleware(resolveMiddleware, ...middlewares)
  const composedEnhancers: StoreEnhancer<any, any> = compose(
    appliedMiddlewares,
    ...enhancers
  )

  const store = createStore(
    combinedReducers,
    actualInitialState,
    composedEnhancers
  ) as any

  resolveMiddleware.run(isClient, {
    store,
    resolveContext,
    customSagas,
    sessionId,
  })

  return store
}

export { createResolveStore }
