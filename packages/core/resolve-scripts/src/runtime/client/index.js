import React from 'react'
import { render } from 'react-dom'
import createHistory from 'history/createBrowserHistory'

import AppContainer from './components/AppContainer'
import createStore from './store/create_store'
import deserializeInitialState from './store/deserialize_initial_state'

import routes from '$resolve.routes'
import rootPath from '$resolve.rootPath'
import aggregateActions from '$resolve.aggregateActions'

const initialState = deserializeInitialState(window.__INITIAL_STATE__)

const origin = window.location.origin

const history = createHistory({
  basename: rootPath
})

const isClient = true

const store = createStore({
  initialState,
  history,
  origin,
  rootPath,
  isClient
})

render(
  <AppContainer
    origin={origin}
    rootPath={rootPath}
    aggregateActions={aggregateActions}
    store={store}
    history={history}
    routes={routes}
  />,
  document.getElementsByClassName('app-container')[0]
)
