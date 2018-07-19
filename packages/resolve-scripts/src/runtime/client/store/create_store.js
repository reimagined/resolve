import { createStore, applyMiddleware, combineReducers } from 'redux'
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware
} from 'resolve-redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import uuid from 'uuid/v4'

export default ({
  redux: { reducers, middlewares, store: setupStore },
  viewModels,
  readModels,
  aggregates,
  subscribeAdapter
}) => ({ initialState, history, origin, rootPath, isClient }) => {
  const sessionId = uuid()

  if (process.env.NODE_ENV !== 'production') {
    if (isClient) {
      require('./create_hmr_socket')({ origin, rootPath })
    }
  }

  const resolveMiddleware = createResolveMiddleware()

  const store = createStore(
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
    isClient
  })

  setupStore(store, middlewares)

  return store
}
