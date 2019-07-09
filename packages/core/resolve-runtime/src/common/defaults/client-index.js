import React from 'react'
import { render } from 'react-dom'
import {
  AppContainer,
  createActions,
  createStore,
  deserializeInitialState
} from 'resolve-redux'
import { createBrowserHistory } from 'history'

import routes from '$resolve.routes'
import rootPath from '$resolve.rootPath'
import staticPath from '$resolve.staticPath'
import viewModels from '$resolve.viewModels'
import readModels from '$resolve.readModels'
import aggregates from '$resolve.aggregates'
import subscribeAdapter from '$resolve.subscribeAdapter'
import redux from '$resolve.redux'

var aggregateActions = {}
for (var index = 0; index < aggregates.length; index++) {
  Object.assign(aggregateActions, createActions(aggregates[index]))
}

var initialState = deserializeInitialState(viewModels, window.__INITIAL_STATE__)

var origin =
  window.location.origin == null
    ? window.location.protocol +
      '//' +
      window.location.hostname +
      (window.location.port ? ':' + window.location.port : '')
    : window.location.origin

var history = createBrowserHistory({
  basename: rootPath
})

var isClient = true

var store = createStore({
  redux: redux,
  viewModels: viewModels,
  readModels: readModels,
  aggregates: aggregates,
  subscribeAdapter: subscribeAdapter,
  initialState: initialState,
  history: history,
  origin: origin,
  rootPath: rootPath,
  isClient: isClient
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
