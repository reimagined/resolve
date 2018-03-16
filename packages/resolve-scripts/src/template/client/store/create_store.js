import { createStore, applyMiddleware, combineReducers } from 'redux'
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createResolveMiddleware
} from 'resolve-redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'

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
      readModels: createReadModelsReducer()
    }),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        routerMiddleware(history),
        createResolveMiddleware({
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
