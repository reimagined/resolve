import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { createStore } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import Routes from './components/Routes'
import getRoutes from './get-routes'
import getRedux from './get-redux'
import * as Redux from 'react-redux'

const entryPoint = context => {
  const history = createBrowserHistory({ basename: context.rootPath })
  const routes = getRoutes()

  const store = createStore({
    ...context,
    redux: getRedux(),
    isClient: true
  })

  render(
    <Redux.Provider store={store}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </Redux.Provider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
