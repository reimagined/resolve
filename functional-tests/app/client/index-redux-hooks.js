import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import { createBrowserHistory } from 'history'
import { renderRoutes } from 'react-router-config'

import { routes } from './redux-hooks/routes'
import { getRedux } from './redux-hooks/get-redux'

const entryPoint = (resolveContext) => {
  const rootPath = '/redux-hooks'
  const history = createBrowserHistory({ basename: rootPath })
  const redux = getRedux()

  const store = createResolveStore(
    {
      ...resolveContext,
      rootPath,
    },
    {
      redux,
    }
  )

  let appContainer = document.getElementById('app-container')
  if (!appContainer) {
    appContainer = document.createElement('div')
    document.body.appendChild(appContainer)
  }

  render(
    <ResolveReduxProvider context={resolveContext} store={store}>
      <Router history={history}>{renderRoutes(routes)}</Router>
    </ResolveReduxProvider>,
    appContainer
  )
}

export default entryPoint
