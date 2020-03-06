import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'
import { Router } from 'react-router'

import Routes from './components/Routes'
import getRoutes from './get-routes'
import getRedux from './get-redux'

const entryPoint = ({
  rootPath,
  staticPath,
  viewModels,
  subscribeAdapter,
  clientImports
}) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = getRedux(clientImports)
  const routes = getRoutes(clientImports)

  const store = createStore({
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
    >
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </AppContainer>,
    document.getElementById('app-container')
  )
}

export default entryPoint
