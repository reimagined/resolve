import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { Router } from 'react-router'
import { createBrowserHistory } from 'history'

import Routes from './hooks/components/Routes'
import routes from './hooks/routes'
import UploaderContext from './hooks/context'

const entryPoint = (resolveContext) => {
  const history = createBrowserHistory({ basename: resolveContext.rootPath })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)

  let version = ''
  try {
    const maybeVersion = resolveContext.clientImports['version']().VERSION
    if (maybeVersion.constructor === String) {
      version = maybeVersion
    }
  } catch (e) {}

  render(
    <ResolveProvider context={resolveContext}>
      <UploaderContext.Provider value={{ CDNUrl: resolveContext.cdnUrl }}>
        <Router history={history}>
          <Routes routes={routes} version={version} />
        </Router>
      </UploaderContext.Provider>
    </ResolveProvider>,
    appContainer
  )
}

export default entryPoint
