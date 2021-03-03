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
import { v4 as uuid } from 'uuid'
import { Context } from '@resolve-js/client'

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
  sagas?: Saga[]
}

type ResolveStoreParameters = {
  redux?: ResolveRedux
  initialState?: any
  serializedState?: string
}

const createResolveStore = (
  resolveContext: Context,
  params: ResolveStoreParameters = {},
  isClient = true
): Store => {
  const sessionId = uuid()
  const { viewModels } = resolveContext
  const {
    initialState,
    serializedState,
    redux: { reducers = [], middlewares = [], enhancers = [], sagas = [] } = {},
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
    customSagas: sagas,
    sessionId,
  })

  return store
}

export { createResolveStore }
