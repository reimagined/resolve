import {
  createStore as reduxCreateStore,
  applyMiddleware,
  combineReducers
} from 'redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import uuid from 'uuid/v4'

import createViewModelsReducer from './create_view_models_reducer'
import createReadModelsReducer from './create_read_models_reducer'
import createResolveMiddleware from './create_resolve_middleware'
import createJwtReducer from './create_jwt_reducer'

const createStore = ({
  redux: { reducers, middlewares, store: setupStore },
  viewModels,
  readModels,
  aggregates,
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

  const store = reduxCreateStore(
    combineReducers({
      ...reducers,
      router: routerReducer,
      viewModels: createViewModelsReducer(viewModels),
      readModels: createReadModelsReducer(readModels),
      jwt: createJwtReducer()
    }),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        routerMiddleware(history),
        resolveMiddleware,
        ...middlewares
      )
    )
  )

  resolveMiddleware.run({
    store,
    viewModels,
    readModels,
    aggregates,
    origin,
    rootPath,
    subscribeAdapter,
    sessionId,
    jwtProvider,
    isClient
  })

  setupStore(store, middlewares)

  return store
}

export default createStore
