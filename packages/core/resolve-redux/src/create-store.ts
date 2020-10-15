import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers,
  compose,
} from 'redux'
import uuid from 'uuid/v4'

import { create as createJwtReducer } from './internal/jwt-reducer'
import { create as createViewModelReducer } from './view-model/view-model-reducer'
import { reducer as readModelReducer } from './read-model/read-model-reducer'
import createResolveMiddleware from './create-resolve-middleware'
import { ReduxStoreContext } from './types'
import deserializeInitialState from './internal/deserialize-initial-state'

const createStore = ({
  redux: {
    reducers = {},
    middlewares = [],
    enhancers = [],
    sagas: customSagas = [],
  } = {},
  viewModels = [],
  jwtProvider = undefined,
  origin,
  rootPath,
  staticPath,
  initialState = undefined,
  serializedState,
  isClient,
  queryMethod,
}: ReduxStoreContext): any => {
  const sessionId = uuid()

  if (serializedState != null && initialState != null) {
    throw Error(
      `ambiguous initial state: both initialState and serializedState set`
    )
  }

  let actualInitialState

  if (serializedState != null) {
    actualInitialState = deserializeInitialState(viewModels, serializedState)
  } else {
    actualInitialState = initialState
  }

  const resolveMiddleware = createResolveMiddleware()

  const combinedReducers = combineReducers({
    ...reducers,
    viewModels: createViewModelReducer(),
    readModels: readModelReducer,
    jwt: createJwtReducer(), // does it really actual?
  })

  const appliedMiddlewares = applyMiddleware(resolveMiddleware, ...middlewares)

  const composedEnhancers = compose(appliedMiddlewares, ...enhancers)

  const store = reduxCreateStore(
    combinedReducers,
    actualInitialState,
    composedEnhancers
  ) as any

  resolveMiddleware.run({
    store,
    viewModels,
    origin,
    rootPath,
    staticPath,
    sessionId,
    jwtProvider,
    isClient,
    customSagas,
    queryMethod,
  })

  return store
}

export default createStore
