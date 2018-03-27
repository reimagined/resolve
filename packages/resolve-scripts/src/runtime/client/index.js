import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter } from 'react-router-redux'

import Routes from './components/Routes'
import createStore from './store/create_store'

const routes = require($resolve.routes)

const history = createHistory({
  basename: process.env.ROOT_PATH
})
const store = createStore(window.__INITIAL_STATE__, history)

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes routes={routes} />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('resolve-application-container')
)
