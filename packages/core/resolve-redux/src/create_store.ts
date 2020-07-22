import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers,
  compose
} from 'redux'
import uuid from 'uuid/v4'

import createViewModelsReducer from './create_view_models_reducer'
import { create as createReadModelReducer } from './read-model/read-model-reducer'
import createJwtReducer from './create_jwt_reducer'
import createResolveMiddleware from './create-resolve-middleware'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'
import emptySubscribeAdapter from './empty_subscribe_adapter'
import { ReduxStoreContext } from './types'

const createStore = ({
  redux: {
    reducers = {},
    middlewares = [],
    enhancers = [],
    sagas: customSagas = []
  } = {},
  viewModels = [],
  subscribeAdapter = emptySubscribeAdapter,
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
    viewModels: createViewModelsReducer(viewModels),
    readModels: createReadModelReducer(),
    jwt: createJwtReducer()
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
    subscribeAdapter,
    jwtProvider,
    isClient,
    customSagas,
    queryMethod
  })

  if (jwtProvider != null) {
    syncJwtProviderWithStore(jwtProvider, store).catch(
      // eslint-disable-next-line no-console
      error => console.error(error)
    )
  }

  return store
}

export default createStore
