import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers,
  compose,
} from 'redux'
import { v4 as uuid } from 'uuid'

import { reducer as viewModelReducer } from './view-model/view-model-reducer'
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
}: ReduxStoreContext): any => {
  // eslint-disable-next-line no-console
  console.warn(
    'createStore function is deprecated and will be removed in future versions, migrate to createResolveStore'
  )

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
    viewModels: viewModelReducer,
    readModels: readModelReducer,
    jwt: (jwt = {}) => jwt,
  })

  const appliedMiddlewares = applyMiddleware(resolveMiddleware, ...middlewares)

  const composedEnhancers = compose(appliedMiddlewares, ...enhancers)

  const store = reduxCreateStore(
    combinedReducers,
    actualInitialState,
    composedEnhancers
  ) as any

  resolveMiddleware.run(isClient, {
    store,
    resolveContext: {
      viewModels,
      rootPath,
      staticPath,
      origin,
      jwtProvider,
    },
    customSagas,
    sessionId,
  })

  return store
}

export default createStore
