import { createStore, applyMiddleware, combineReducers } from 'redux'
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware
} from 'resolve-redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'

import reducers from '$resolve.redux.reducers'
import middlewares from '$resolve.redux.middlewares'
import setupStore from '$resolve.redux.store'
import viewModels from '$resolve.viewModels'
import readModels from '$resolve.readModels'
import aggregates from '$resolve.aggregates'
import subscribeAdapter from '$resolve.subscribe.adapter'

export default ({ initialState, history, origin, rootPath }) => {
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
          viewModels,
          readModels,
          aggregates,
          subscribeAdapter,
          origin,
          rootPath
        }),
        ...middlewares
      )
    )
  )

  setupStore(store, middlewares)

  return store
}
