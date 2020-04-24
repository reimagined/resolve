import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import routes from './routes'
import Routes from './components/Routes'

const entryPoint = ({ rootPath, staticPath, viewModels, subscribeAdapter }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const store = createStore({
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
    >
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </AppContainer>,
    appContainer
  )
}

export default entryPoint
