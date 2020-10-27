import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { Provider } from 'react-redux'
import { createBrowserHistory } from 'history'
import { createResolveStore } from 'resolve-redux'

import getRoutes from './get-routes'
import getRedux from './get-redux'

import Routes from './components/Routes'

const entryPoint = (clientContext) => {
  const history = createBrowserHistory({ basename: clientContext.rootPath })
  const routes = getRoutes()
  const redux = getRedux(clientContext.clientImports, history)

  const store = createResolveStore(clientContext, {
    serializedState: window.__INITIAL_STATE__,
    redux,
  })

  render(
    <Provider store={store}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </Provider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
