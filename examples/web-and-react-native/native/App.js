import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Providers } from './resolve/resolve-redux'
import {
  origin,
  rootPath,
  staticPath,
  aggregateActions
} from './resolve/config'
import store from './redux/store'

import Todos from './client/containers/Todos'

export default class App extends React.PureComponent {
  render() {
    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        aggregateActions={aggregateActions}
        store={store}
      >
        <View style={styles.container}>
          <Todos />
        </View>
      </Providers>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
