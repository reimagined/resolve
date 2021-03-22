import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import {
  AppContainer,
  createStore,
  deserializeInitialState,
  getOrigin,
} from '@resolve-js/redux'
import { Router } from 'react-router'

import getRoutes from './get-routes'
import getRedux from './get-redux'
import Routes from './components/Routes'

const entryPoint = ({
  rootPath,
  staticPath,
  viewModels,
  subscriber,
  clientImports,
}) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })

  const redux = getRedux(clientImports)
  const routes = getRoutes(clientImports)

  const store = createStore({
    initialState: deserializeInitialState(viewModels, window.__INITIAL_STATE__),
    redux,
    viewModels,
    subscriber,
    history,
    origin,
    rootPath,
    isClient: true,
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
