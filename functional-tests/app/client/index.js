import React from 'react'
import { render } from 'react-dom'

import App from './containers/App'
import { ResolveContext } from 'resolve-react-hooks'

const entryPoint = (resolveContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={resolveContext}>
      <App staticPath={resolveContext.staticPath} />
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
