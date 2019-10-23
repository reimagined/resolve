import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import {
  AppContainer,
  createStore,
  deserializeInitialState,
  getOrigin
} from 'resolve-redux'

import getRoutes from './get-routes'
import getRedux from './get-redux'

const entryPoint = ({
  clientImports,
  rootPath,
  staticPath,
  viewModels,
  subscribeAdapter
}) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const routes = getRoutes(clientImports)
  const redux = getRedux(clientImports)

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
