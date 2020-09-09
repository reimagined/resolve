import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import routes from './routes'
import Routes from './components/Routes'

import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'

const entryPoint = ({ rootPath, staticPath, viewModels, subscriber }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = {
    reducers: { optimisticShoppingLists: optimisticShoppingListsReducer },
    sagas: [optimisticShoppingListsSaga],
  }

  const store = createStore({
    redux,
    viewModels,
    subscriber,
    history,
    origin,
    rootPath,
    isClient: true,
  })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
    >
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </AppContainer>,
    appContainer
  )
}

export default entryPoint
