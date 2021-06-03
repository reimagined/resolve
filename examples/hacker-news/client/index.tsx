import React from 'react'
import { render } from 'react-dom'
import { renderRoutes } from 'react-router-config'
import { Router } from 'react-router'
import { createBrowserHistory } from 'history'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'

import { getRoutes } from './get-routes'
import getRedux from './get-redux'

const entryPoint = (clientContext) => {
  const history = createBrowserHistory({ basename: clientContext.rootPath })
  const routes = getRoutes()
  const redux = getRedux(clientContext.clientImports, history)

  const store = createResolveStore(clientContext, {
    serializedState: (window as any).__INITIAL_STATE__,
    redux,
  })

  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <Router history={history}>{renderRoutes(routes)}</Router>
    </ResolveReduxProvider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
