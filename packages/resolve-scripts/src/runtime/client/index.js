import React from 'react'
import { render } from 'react-dom'
import createHistory from 'history/createBrowserHistory'

import AppContainer from './components/AppContainer'
import createStore from './store/create_store'
import deserializeInitialState from './store/deserialize_initial_state'

import routes from '$resolve.routes'
import rootPath from '$resolve.rootPath'
import staticPath from '$resolve.staticPath'
import aggregateActions from '$resolve.aggregateActions'

import redux from '$resolve.redux'
import viewModels from '$resolve.viewModels'
import readModels from '$resolve.readModels'
import aggregates from '$resolve.aggregates'
import subscribeAdapter from '$resolve.subscribeAdapter'

const initialState = deserializeInitialState(window.__INITIAL_STATE__)

const origin = window.location.origin

const history = createHistory({
  basename: rootPath
})

const isClient = true

const store = createStore({
  redux,
  viewModels,
  readModels,
  aggregates,
  subscribeAdapter
})({
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
    staticPath={staticPath}
    aggregateActions={aggregateActions}
    store={store}
    history={history}
    routes={routes}
  />,
  document.getElementsByClassName('app-container')[0]
)
