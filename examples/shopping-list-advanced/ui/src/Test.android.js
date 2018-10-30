import React from 'react'
import { View, Text } from 'react-native'

const R = require('rambda')
const result = R.compose(
  R.map(x => x * 2),
  R.filter(x => x > 2)
)([1, 2, 3, 4])

export default class Test extends React.PureComponent {
  render() {
    return (
      <View>
        <Text>Hello Android {JSON.stringify(result)}</Text>
      </View>
    )
  }
}
