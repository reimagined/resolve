import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import getRoutes from './get-routes'
import getRedux from './get-redux'
const entryPoint = (clientContext) => {
  const store = createResolveStore(clientContext, {
    serializedState: window.__INITIAL_STATE__,
    redux: getRedux(),
  })
  const routes = getRoutes()
  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveReduxProvider>,
    document.getElementById('app-container')
  )
}
export default entryPoint
