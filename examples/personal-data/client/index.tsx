import * as React from 'react'
import { ResolveContext } from 'resolve-react-hooks'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import UploaderContext from './context'

// import App from './components/App'

import routes from './routes'

const entryPoint = (context: any): any => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={context}>
      <UploaderContext.Provider value={context.localS3Constants}>
        <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
      </UploaderContext.Provider>
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
