import React from 'react'
import { render } from 'react-dom'
import { renderRoutes } from 'react-router-config'
import { BrowserRouter } from 'react-router-dom'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'

import { getRoutes } from './get-routes'
import { getRedux } from './get-redux'

const entryPoint = (clientContext: any) => {
  const routes = getRoutes()
  const redux = getRedux()

  const store = createResolveStore(clientContext, {
    serializedState: (window as any).__INITIAL_STATE__,
    redux,
  })

  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveReduxProvider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
