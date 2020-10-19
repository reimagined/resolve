import React from 'react'
import { render } from 'react-dom'

import App from './primary/containers/App'
import { ResolveContext } from 'resolve-react-hooks'

const entryPoint = (resolveContext) => {
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
    <ResolveContext.Provider value={resolveContext}>
      <App staticPath={resolveContext.staticPath} version={version} />
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
