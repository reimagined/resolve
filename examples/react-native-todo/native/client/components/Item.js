import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from 'react-native-elements'

const styles = StyleSheet.create({
  textChecked: {
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 18,
    textDecorationLine: 'line-through'
  },
  textUnchecked: {
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 18
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#dddddd'
  },
  checkbox: {
    paddingRight: 2
  },
  remove: {
    paddingLeft: 5
  }
})

class Item extends React.PureComponent {
  render() {
    const { checked, text, removeItem, toggleItem } = this.props

    return (
      <View>
        <View style={styles.container}>
          <Icon
            color="#767676"
            type="material-community"
            name={
              checked ? 'checkbox-marked-outline' : 'checkbox-blank-outline'
            }
            size={36}
            containerStyle={styles.checkbox}
            onPress={toggleItem}
          />
          <Text
            style={checked ? styles.textChecked : styles.textUnchecked}
            onPress={toggleItem}
          >
            {text}
          </Text>
          <Icon
            color="#767676"
            type="material-community"
            name="close-circle-outline"
            size={36}
            containerStyle={styles.remove}
            onPress={removeItem}
          />
        </View>
        <View style={styles.separator} />
      </View>
    )
  }
}

export default Item
