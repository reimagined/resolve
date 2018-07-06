import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter } from 'react-router-redux'
import uuid from 'uuid/v4'

import Routes from './components/Routes'
import createStore from './store/create_store'
import deserializeInitialState from './store/deserialize_initial_state'

import routes from '$resolve.routes'

import rootPath from '$resolve.rootPath'
// TODO
import aggregateActions from '$resolve.aggregateActions'
console.log(aggregateActions)

const initialState = deserializeInitialState(window.__INITIAL_STATE__)

const origin = window.location.origin

const history = createHistory({
  basename: rootPath
})

const sessionId = uuid()

const isClient = true

const store = createStore({
  initialState,
  history,
  origin,
  rootPath,
  sessionId,
  isClient
})

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes routes={routes} />
    </ConnectedRouter>
  </Provider>,
  document.getElementsByClassName('app-container')[0]
)
