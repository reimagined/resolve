import React from 'react'
import { Text, View, Image, StyleSheet } from 'react-native'

import ResolveLogo from '../assets/resolve-logo.png'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  image: {
    width: 35,
    height: 35
  },
  text: {
    marginBottom: 30,
    marginLeft: 5,
    fontSize: 27
  }
})

class Logo extends React.PureComponent {
  render() {
    return (
      <View style={styles.container}>
        <Image style={styles.image} source={ResolveLogo} />
        <Text style={styles.text}>Shopping List</Text>
      </View>
    )
  }
}

export default Logo
