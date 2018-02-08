import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import clientConfig from './configs/client.config'
import ResolveRoutes from './resolve-routes'

const { routes, createStore } = clientConfig
const store = createStore(window.__INITIAL_STATE__)

render(
  <Provider store={store}>
    <BrowserRouter basename={window.__PROCESS_ENV__.ROOT_PATH}>
      <ResolveRoutes routes={routes} />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
