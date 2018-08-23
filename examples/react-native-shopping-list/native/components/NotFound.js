import React from 'react'
import { StyleSheet, View } from "react-native";
import { Text } from "native-base";

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
        <Text>
          Users not found
        </Text>
      </View>
    )
  }
}

export default NotFound
