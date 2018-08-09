import React from 'react'

import * as config from '../resolve/config.js'

import { StyleSheet, Text, View } from 'react-native'

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    width: '100%',
    paddingBottom: 5
  }
})

// eslint-disable-next-line
console.log(config)

export class App extends React.PureComponent {
  render() {
    return (
      <View style={styles.layout}>
        <Text style={styles.title}>
          Hello
          {JSON.stringify(config)}
        </Text>
      </View>
    )
  }
}

export default App
