import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import clientConfig from './configs/client.config'
import ResolveRoutes from './resolve-routes'

const { routes, createStore } = clientConfig
const store = createStore(window.__INITIAL_STATE__)

const Routes = ResolveRoutes(routes, { Route, Redirect, Switch })

render(
  <Provider store={store}>
    <BrowserRouter basename={window.__PROCESS_ENV__.ROOT_PATH}>
      <Routes routes={routes} />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
