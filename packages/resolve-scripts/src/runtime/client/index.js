import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter } from 'react-router-redux'

import Routes from './components/Routes'
import createStore from './store/create_store'
import deserializeInitialState from './store/deserialize_initial_state'

const routes = require($resolve.routes)

const history = createHistory({
  basename: process.env.ROOT_PATH
})

const initialState = deserializeInitialState(window.__INITIAL_STATE__)

const store = createStore(initialState, history)

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes routes={routes} />
    </ConnectedRouter>
  </Provider>,
  document.getElementsByClassName('app-container')[0]
)
