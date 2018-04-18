import React, { Component } from 'react'
import { View, Text, Styles } from 'reactxp'

const styles = {
  view: Styles.createViewStyle({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  })
}

export default class App extends Component {
  render() {
    return (
      <View style={styles.view}>
        <Text>Hello World!!!</Text>
      </View>
    )
  }
}
