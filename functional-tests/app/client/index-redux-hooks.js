import React from 'react'
import * as Redux from 'react-redux'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { ResolveContext } from 'resolve-react-hooks'
import { createStore, getOrigin } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import Routes from './redux-hooks/components/Routes'
import routes from './redux-hooks/routes'
import getRedux from './redux-hooks/get-redux'

const entryPoint = (resolveContext) => {
  const { viewModels, subscriber, clientImports } = resolveContext
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
    <Redux.Provider store={store}>
      <ResolveContext.Provider value={resolveContext}>
        <Router history={history}>
          <Routes routes={routes} />
        </Router>
      </ResolveContext.Provider>
      ,
    </Redux.Provider>,
    appContainer
  )
}

export default entryPoint
