import React from 'react'
import { render } from 'react-dom'

import App from './containers/App'
import UploaderContext from './context'

const entryPoint = ({ staticPath, localS3Constants }) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <UploaderContext.Provider value={localS3Constants}>
      <App staticPath={staticPath} />
    </UploaderContext.Provider>,
    appContainer
  )
}

export default entryPoint
