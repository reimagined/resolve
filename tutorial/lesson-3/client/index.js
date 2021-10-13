import React from 'react'
import { render } from 'react-dom'
import { ResolveContext } from '@resolve-js/react-hooks'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import routes from './routes'

// The 'context' object contains metadata required by the '@resolve-js/react-hooks'
// library to connect to the reSolve backend.
const entryPoint = (context) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={context}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
