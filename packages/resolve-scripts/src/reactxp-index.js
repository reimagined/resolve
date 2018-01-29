import React from 'react'
import RX from 'reactxp'
import { Provider } from 'react-redux'

import clientConfig from './configs/client.config'

const { rootComponent: RootComponent, createStore } = clientConfig
const store = createStore(window.__INITIAL_STATE__)

RX.App.initialize(true, true)
RX.UserInterface.setMainView(
  <Provider store={store}>
    <RootComponent />
  </Provider>
)
