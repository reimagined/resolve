import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers,
  compose
} from 'redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import uuid from 'uuid/v4'

import createViewModelsReducer from './create_view_models_reducer'
import createReadModelsReducer from './create_read_models_reducer'
import createJwtReducer from './create_jwt_reducer'
import createResolveMiddleware from './create_resolve_middleware'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'

const createStore = ({
  redux: { reducers, middlewares, enhancers, sagas: customSagas },
  viewModels,
  subscribeAdapter,
  initialState,
  history,
  origin,
  rootPath,
  jwtProvider,
  isClient
}) => {
  const sessionId = uuid()

  const resolveMiddleware = createResolveMiddleware()

  const combinedReducers = combineReducers({
    ...reducers,
    router: routerReducer,
    viewModels: createViewModelsReducer(viewModels),
    readModels: createReadModelsReducer(),
    jwt: createJwtReducer()
  })

  const appliedMiddlewares = applyMiddleware(
    routerMiddleware(history),
    resolveMiddleware,
    ...middlewares
  )

  const composedEnhancers = compose(
    appliedMiddlewares,
    ...enhancers
  )

  const store = reduxCreateStore(
    combinedReducers,
    initialState,
    composedEnhancers
  )

  resolveMiddleware.run({
    store,
    viewModels,
    origin,
    rootPath,
    subscribeAdapter,
    sessionId,
    jwtProvider,
    isClient,
    customSagas
  })

  syncJwtProviderWithStore(jwtProvider, store).catch(
    // eslint-disable-next-line no-console
    error => console.error(error)
  )

  return store
}

export default createStore
