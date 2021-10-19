import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { getRoutes } from './get-routes'
const entryPoint = (clientContext) => {
  render(
    <ResolveProvider context={clientContext}>
      <BrowserRouter>{renderRoutes(getRoutes())}</BrowserRouter>
    </ResolveProvider>,
    document.getElementById('app-container')
  )
}
export default entryPoint
