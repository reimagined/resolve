import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import {
  AppContainer,
  createStore,
  deserializeInitialState,
  getOrigin
} from 'resolve-redux'

import optimisticShoppingListsSaga from './redux/sagas/optimistic-shopping-lists-saga'
import optimisticShoppingListsReducer from './redux/reducers/optimistic-shopping-lists'

import optimisticSharingsSaga from './redux/sagas/optimistic-sharings-saga'
import optimisticSharingsReducer from './redux/reducers/optimistic-sharings'

import routes from './routes'

const entryPoint = ({ rootPath, staticPath, viewModels, subscribeAdapter }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = {
    reducers: {
      optimisticSharings: optimisticSharingsReducer,
      optimisticShoppingLists: optimisticShoppingListsReducer
    },
    sagas: [optimisticSharingsSaga, optimisticShoppingListsSaga]
  }

  const store = createStore({
    initialState: deserializeInitialState(viewModels, window.__INITIAL_STATE__),
    redux,
    viewModels,
    subscribeAdapter,
    history,
    origin,
    rootPath,
    isClient: true
  })

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
      history={history}
      routes={routes}
    />,

    document.getElementsByClassName('app-container')[0]
  )
}

export default entryPoint
