import React from 'react'
import { render } from 'react-dom'
import { renderRoutes } from 'react-router-config'
import { BrowserRouter } from 'react-router-dom'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'

import { routes } from './hoc/routes'
import { getRedux } from './hoc/get-redux'

const entryPoint = (clientContext) => {
  const rootPath = '/hoc'
  const redux = getRedux()

  const store = createResolveStore(clientContext, {
    serializedState: window.__INITIAL_STATE__,
    redux,
  })

  let appContainer = document.getElementById('app-container')
  if (!appContainer) {
    appContainer = document.createElement('div')
    document.body.appendChild(appContainer)
  }

  render(
    <ResolveReduxProvider
      context={{ ...clientContext, rootPath }}
      store={store}
    >
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveReduxProvider>,
    appContainer
  )
}

export default entryPoint
