import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'

import routes from './routes'

const entryPoint = ({ rootPath, staticPath }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const store = createStore({ history, origin, rootPath, isClient: true })

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
      history={history}
      routes={routes}
    />,

    document.getElementsByClassName('app-container')[0]
  )
}

export default entryPoint
