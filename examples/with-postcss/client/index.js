import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { createBrowserHistory } from 'history'
import { ResolveProvider } from '@resolve-js/react-hooks'

import { getRoutes } from './get-routes'
import Routes from './components/Routes'

const entryPoint = (clientContext) => {
  const history = createBrowserHistory({ basename: clientContext.rootPath })

  render(
    <ResolveProvider context={clientContext}>
      <Router history={history}>
        <Routes routes={getRoutes()} />
      </Router>
    </ResolveProvider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
