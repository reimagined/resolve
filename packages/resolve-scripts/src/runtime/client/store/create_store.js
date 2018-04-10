import { createStore, applyMiddleware, combineReducers } from 'redux'
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware
} from 'resolve-redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'

const protocol = $resolve.protocol
const host = $resolve.host
const port = $resolve.port
const rootPath = $resolve.rootPath
const reducers = require($resolve.redux.reducers)
const middlewares = require($resolve.redux.middlewares)
const setupStore = require($resolve.redux.store)
const viewModels = require($resolve.viewModels)
const readModels = require($resolve.readModels)
const aggregates = require($resolve.aggregates)
const subscribeAdapter = require($resolve.subscribe.adapter)

export default (initialState, history) => {
  const store = createStore(
    combineReducers({
      ...reducers,
      router: routerReducer,
      viewModels: createViewModelsReducer(),
      readModels: createReadModelsReducer(),
      jwt: createJwtReducer()
    }),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        routerMiddleware(history),
        createResolveMiddleware({
          origin: `${protocol}://${host}:${port}`,
          rootPath: rootPath ? `/${rootPath}` : '',
          viewModels,
          readModels,
          aggregates,
          subscribeAdapter
        }),
        ...middlewares
      )
    )
  )

  const isClient = typeof window === 'object'

  setupStore(store, middlewares, isClient)

  return store
}
