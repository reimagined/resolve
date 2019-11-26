import React from 'react'
import { render } from 'react-dom'
import { createStore, getOrigin } from 'resolve-redux'
import { createBrowserHistory } from 'history'

import App from './containers/App'
import UploaderContext from './context'

const entryPoint = ({ rootPath, staticPath, localS3Constants }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })

  const store = createStore({
    history,
    origin,
    rootPath,
    isClient: true
  })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <UploaderContext.Provider value={localS3Constants}>
      <App staticPath={staticPath} store={store} />
    </UploaderContext.Provider>,
    appContainer
  )
}

export default entryPoint
