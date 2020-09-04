import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { ResolveContext } from 'resolve-react-hooks'
import { createStore } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import Routes from './components/Routes'
import getRoutes from './get-routes'
import getRedux from './get-redux'
import * as Redux from 'react-redux'

const entryPoint = (context) => {
  const history = createBrowserHistory({ basename: context.rootPath })
  const routes = getRoutes()

  const store = createStore({
    ...context,
    redux: getRedux(),
    isClient: true,
  })

  let appContainer = document.getElementById('app-container')
  if (!appContainer) {
    appContainer = document.createElement('div')
    document.body.appendChild(appContainer)
  }

  render(
    <Redux.Provider store={store}>
      <ResolveContext.Provider value={context}>
        <Router history={history}>
          <Routes routes={routes} />
        </Router>
      </ResolveContext.Provider>
    </Redux.Provider>,
    appContainer
  )
}

export default entryPoint
