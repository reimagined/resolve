import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, H1, H2 } from 'native-base'

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20
  }
})

class NotFound extends React.PureComponent {
  render() {
    return (
      <View style={styles.container}>
        <H1>Oops!</H1>
        <H2>404 Not Found</H2>
        <Text>Sorry, an error has occurred, Requested page not found!</Text>
      </View>
    )
  }
}

export default NotFound
