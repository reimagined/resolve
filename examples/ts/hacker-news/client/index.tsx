import type { PropsWithChildren } from 'react'
import type { BrowserHistory } from 'history'
import React, { useState, useLayoutEffect } from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'

import { getRoutes } from './get-routes'
import { getRedux } from './get-redux'
import { App } from './containers/App'

function BrowserRouter(
  props: PropsWithChildren<{ basename: string; history: BrowserHistory }>
) {
  let { basename, children, history } = props

  let [state, setState] = useState({
    action: history.action,
    location: history.location,
  })
  useLayoutEffect(() => history.listen(setState), [history])
  return (
    <Router
      basename={basename}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  )
}

const entryPoint = (clientContext: any) => {
  const history = createBrowserHistory()
  const redux = getRedux(clientContext.clientImports, history)

  const store = createResolveStore(clientContext, {
    serializedState: (window as any).__INITIAL_STATE__,
    redux,
  })

  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <BrowserRouter history={history} basename={clientContext.rootPath}>
        <App routes={getRoutes()} />
      </BrowserRouter>
    </ResolveReduxProvider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
