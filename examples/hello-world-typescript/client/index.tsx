import * as React from 'react'
import { render } from 'react-dom'

import App from './containers/App'

const entryPoint = ({ staticPath }): any => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(<App staticPath={staticPath} />, appContainer)
}

export default entryPoint
