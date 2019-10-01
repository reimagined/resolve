import React from 'react'
import { render } from 'react-dom'
import {
  AppContainer,
  createActions,
  createStore,
  deserializeInitialState
} from 'resolve-redux'
import { createBrowserHistory } from 'history'

import rootPath from '$resolve.rootPath'
import staticPath from '$resolve.staticPath'
import viewModels from '$resolve.viewModels'
import readModels from '$resolve.readModels'
import aggregates from '$resolve.aggregates'
import subscribeAdapter from '$resolve.subscribeAdapter'
import clientImports from '$resolve.clientImports'

var indexConstructor = function(options) {
  var routes = clientImports[options.routes]()
  var redux = {
    reducers:
      options.redux.reducers != null
        ? Object.keys(options.redux.reducers).reduce((acc, key) => {
            acc[key] = clientImports[options.redux.reducers[key]]()
            return acc
          }, {})
        : {},
    sagas:
      options.redux.sagas != null
        ? options.redux.sagas.map(key => clientImports[key]())
        : [],
    middlewares:
      options.redux.middlewares != null
        ? options.redux.middlewares.map(key => clientImports[key]())
        : [],
    enhancers:
      options.redux.enhancers != null
        ? options.redux.enhancers.map(key => clientImports[key]())
        : []
  }

  var aggregateActions = {}
  for (var index = 0; index < aggregates.length; index++) {
    Object.assign(aggregateActions, createActions(aggregates[index]))
  }

  var initialState = deserializeInitialState(
    viewModels,
    window.__INITIAL_STATE__
  )

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
}

export default indexConstructor
