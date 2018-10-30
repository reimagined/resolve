import Expo from 'expo'
import React from 'react'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'

import { Providers } from 'resolve-redux'

import { origin, rootPath, staticPath } from './resolve/config'

import store from './redux/store'
import aggregateActions from './redux/actions/aggregate-actions'

import Routes from './routes'

if (process.env.NODE_ENV === 'development') {
  Expo.KeepAwake.activate()
}

class AppContainer extends React.PureComponent {
  state = {
    isReady: false
  }

  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require('native-base/Fonts/Roboto.ttf'),
      Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
      Ionicons: require('@expo/vector-icons/fonts/Ionicons.ttf')
    })

    this.setState({
      isReady: true
    })
  }

  render() {
    if (!this.state.isReady) {
      return <Expo.AppLoading />
    }

    return (
      <ActionSheetProvider>
        <Providers
          origin={origin}
          rootPath={rootPath}
          staticPath={staticPath}
          aggregateActions={aggregateActions}
          store={store}
        >
          <Routes />
        </Providers>
      </ActionSheetProvider>
    )
  }
}

Expo.registerRootComponent(AppContainer)
