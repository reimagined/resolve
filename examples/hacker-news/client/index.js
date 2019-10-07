import React from 'react'
import { render } from 'react-dom'
import {
  AppContainer,
  createStore,
  deserializeInitialState
} from 'resolve-redux'
import { createBrowserHistory } from 'history'

import resolveChunk from '../dist/common/client/client-chunk'
import getRedux from './get-redux'
import routes from './routes'

const {
  rootPath,
  staticPath,
  viewModels,
  subscribeAdapter,
  clientImports
} = resolveChunk
const { aggregateActions, ...redux } = getRedux(clientImports, 'comments')

const initialState = deserializeInitialState(
  viewModels,
  window.__INITIAL_STATE__
)

const origin =
  window.location.origin == null
    ? window.location.protocol +
      '//' +
      window.location.hostname +
      (window.location.port ? ':' + window.location.port : '')
    : window.location.origin

const history = createBrowserHistory({
  basename: rootPath
})

var store = createStore({
  redux: redux,
  viewModels: viewModels,
  subscribeAdapter: subscribeAdapter,
  initialState: initialState,
  history: history,
  origin: origin,
  rootPath: rootPath,
  isClient: true
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
