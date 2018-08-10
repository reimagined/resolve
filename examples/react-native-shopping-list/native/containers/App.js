import React from 'react'

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

export class App extends React.PureComponent {
  render() {
    return (
      <View style={styles.layout}>
        <Text style={styles.title}>Hello</Text>
      </View>
    )
  }
}

export default App
