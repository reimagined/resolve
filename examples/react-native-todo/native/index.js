import Expo from 'expo'
import React from 'react'

import { Providers } from './resolve/resolve-redux'

import {
  origin,
  rootPath,
  staticPath,
  aggregateActions
} from './resolve/config'

import store from './redux/store'

import App from './client/containers/App'

if (process.env.NODE_ENV === 'development') {
  Expo.KeepAwake.activate()
}

class AppContainer extends React.PureComponent {
  render() {
    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        aggregateActions={aggregateActions}
        store={store}
      >
        <App />
      </Providers>
    )
  }
}

Expo.registerRootComponent(AppContainer)
