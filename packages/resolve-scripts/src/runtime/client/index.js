import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter } from 'react-router-redux'

import Routes from './components/Routes'
import createStore from './store/create_store'

const routes = require($resolve.routes)
const viewModels = require($resolve.viewModels)

const history = createHistory({
  basename: process.env.ROOT_PATH
})

const initialState = window.__INITIAL_STATE__

for (const viewModel of viewModels) {
  for (const aggregateId of Object.keys(
    initialState.viewModels[viewModel.name]
  )) {
    initialState.viewModels[viewModel.name][
      aggregateId
    ] = viewModel.deserializeState(
      initialState.viewModels[viewModel.name][aggregateId]
    )
  }
}

const store = createStore(initialState, history)

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes routes={routes} />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('resolve-application-container')
)
