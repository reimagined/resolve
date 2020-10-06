import React from 'react'
import { render } from 'react-dom'

import App from './hoc/containers/App'

const entryPoint = (resolveContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(<App staticPath={resolveContext.staticPath} />, appContainer)
}

export default entryPoint
