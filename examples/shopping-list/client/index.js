import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'

import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'
import routes from './routes'

const entryPoint = ({ rootPath, staticPath, viewModels, subscribeAdapter }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = {
    reducers: { optimisticShoppingLists: optimisticShoppingListsReducer },
    sagas: [optimisticShoppingListsSaga]
  }

  const store = createStore({
    redux,
    viewModels,
    subscribeAdapter,
    history,
    origin,
    rootPath,
    isClient: true
  })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
      history={history}
      routes={routes}
    />,
    appContainer
  )
}

export default entryPoint
