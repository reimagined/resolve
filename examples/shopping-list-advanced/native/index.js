import { KeepAwake, AppLoading, Font, registerRootComponent } from 'expo'
import React from 'react'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'

import { Providers } from 'resolve-redux'
import { rootPath, staticPath } from './resolve'
import origin from './constants/origin'

import store from './redux/store'

import Routes from './routes'

if (process.env.NODE_ENV === 'development') {
  KeepAwake.activate()
}

class AppContainer extends React.PureComponent {
  state = {
    isReady: false
  }

  async componentDidMount() {
    await Font.loadAsync({
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
      return <AppLoading />
    }

    return (
      <ActionSheetProvider>
        <Providers
          origin={origin}
          rootPath={rootPath}
          staticPath={staticPath}
          store={store}
        >
          <Routes />
        </Providers>
      </ActionSheetProvider>
    )
  }
}

registerRootComponent(AppContainer)
