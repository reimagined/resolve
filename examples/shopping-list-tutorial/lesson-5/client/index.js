import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { AppContainer, createStore, getOrigin } from '@resolve-js/redux'
import { createBrowserHistory } from 'history'

import routes from './routes'

const entryPoint = (clientContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveProvider context={clientContext}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveProvider>,
    appContainer
  )
}

export default entryPoint
