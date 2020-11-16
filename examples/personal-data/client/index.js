import * as React from 'react'
import { ResolveProvider } from 'resolve-react-hooks'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import UploaderContext from './context'

import routes from './routes'

const entryPoint = (clientContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveProvider context={clientContext}>
      <UploaderContext.Provider value={clientContext.localS3Constants}>
        <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
      </UploaderContext.Provider>
    </ResolveProvider>,
    appContainer
  )
}

export default entryPoint
