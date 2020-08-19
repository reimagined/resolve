import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers,
  compose
} from 'redux'
import uuid from 'uuid/v4'

import { create as createViewModelReducer } from './view-model/view-model-reducer'
import { create as createReadModelReducer } from './read-model/read-model-reducer'
import createResolveMiddleware from './create-resolve-middleware'
import { ReduxStoreContext } from './types'

const createStore = ({
  redux: {
    reducers = {},
    middlewares = [],
    enhancers = [],
    sagas: customSagas = []
  } = {},
  viewModels = [],
  jwtProvider = undefined,
  origin,
  rootPath,
  staticPath,
  initialState = undefined,
  isClient,
  queryMethod
}: ReduxStoreContext): any => {
  const sessionId = uuid()

  const resolveMiddleware = createResolveMiddleware()

  const combinedReducers = combineReducers({
    ...reducers,
    viewModels: createViewModelReducer(),
    readModels: createReadModelReducer()
  })

  const appliedMiddlewares = applyMiddleware(resolveMiddleware, ...middlewares)

  const composedEnhancers = compose(appliedMiddlewares, ...enhancers)

  const store = reduxCreateStore(
    combinedReducers,
    initialState,
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
    queryMethod
  })

  return store
}

export default createStore
