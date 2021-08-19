import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import routes from './routes'

const entryPoint = (clientContext: any) => {
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
