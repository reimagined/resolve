import React from 'react'
import { Icon, Left, List, ListItem, Right, Text } from 'native-base'
import { View, StyleSheet, TouchableOpacity } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  button: {
    borderWidth: 0,
    padding: 0,
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5
  },
  checkbox: {
    width: 30,
    fontSize: 24,
    color: '#000'
  },
  remove: {
    fontSize: 24,
    color: '#000'
  },
  textChecked: {
    textDecorationLine: 'line-through',
    width: 0,
    flexGrow: 1,
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20
  },
  textUnchecked: {
    width: 0,
    flexGrow: 1,
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20
  }
})

class ShoppingListItems extends React.PureComponent {
  toggleShoppingItem = id => {
    this.props.toggleShoppingItem(this.props.aggregateId, { id })
  }

  removeShoppingItem = id => {
    this.props.removeShoppingItem(this.props.aggregateId, { id })
  }

  render() {
    const { items } = this.props

    return (
      <List>
        {items.map(({ id, text, checked }) => (
          <ListItem key={id}>
            <Left>
              <View style={styles.container}>
                <View style={styles.subContainer}>
                  <Icon
                    style={styles.checkbox}
                    name={
                      checked
                        ? 'checkbox-marked-outline'
                        : 'checkbox-blank-outline'
                    }
                    type="MaterialCommunityIcons"
                    onPress={this.toggleShoppingItem.bind(this, id)}
                  />
                  <Text
                    style={checked ? styles.textChecked : styles.textUnchecked}
                    onPress={this.toggleShoppingItem.bind(this, id)}
                  >
                    {text}
                  </Text>
                </View>
              </View>
            </Left>
            <Right>
              <TouchableOpacity
                style={styles.button}
                onPress={this.removeShoppingItem.bind(this, id)}
              >
                <Icon
                  style={styles.remove}
                  name="times-circle"
                  type="FontAwesome"
                />
              </TouchableOpacity>
            </Right>
          </ListItem>
        ))}
      </List>
    )
  }
}

export default ShoppingListItems
