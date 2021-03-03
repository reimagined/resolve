import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { AppContainer, createStore, getOrigin } from '@resolve-js/redux'
import { createBrowserHistory } from 'history'

import Routes from './hoc/components/Routes'
import routes from './hoc/routes'
import getRedux from './hoc/get-redux'

const entryPoint = ({ staticPath, viewModels, subscriber, clientImports }) => {
  const rootPath = '/hoc'
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = getRedux(clientImports)

  const store = createStore({
    redux,
    viewModels,
    subscriber,
    history,
    origin,
    rootPath: '',
    isClient: true,
  })

  let appContainer = document.getElementById('app-container')
  if (!appContainer) {
    appContainer = document.createElement('div')
    document.body.appendChild(appContainer)
  }

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
