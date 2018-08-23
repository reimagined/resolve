import React from 'react'
import { List, ListItem, Text, Left, Right, Icon } from 'native-base'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { connectActionSheet } from '@expo/react-native-action-sheet'

const styles = StyleSheet.create({
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
  icon: {
    margin: 0,
    padding: 0,
    fontSize: 24,
    color: '#000'
  },
  picker: {
    width: '100%'
  }
})

const options = ['Edit', 'Share', 'Remove', 'Cancel']

class ShoppingLists extends React.PureComponent {
  onMenuItemSelect = (id, index) => {
    switch (options[index]) {
      case 'Edit':
        this.props.navigate('ShoppingList', { id })
        break
      case 'Share':
        this.props.navigate('ShareForm', { id })
        break
      case 'Remove':
        this.props.removeShoppingList(id, {})
        break
      default:
    }
  }

  onMenuPress = id => {
    this.props.showActionSheetWithOptions(
      {
        options
      },
      this.onMenuItemSelect.bind(this, id),
      3
    )
  }

  onPress = id => {
    this.props.navigate('ShoppingList', { id })
  }

  render() {
    const { lists } = this.props

    return (
      <List>
        {lists.map(({ id, name }, index) => (
          <ListItem key={id}>
            <Left>
              <Text onPress={this.onPress.bind(this, id)}>
                {`${index + 1}. `}
                {name}
              </Text>
            </Left>
            <Right>
              <TouchableOpacity
                style={styles.button}
                onPress={this.onMenuPress.bind(this, id)}
              >
                <Icon
                  style={styles.icon}
                  name="ellipsis-v"
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

export default connectActionSheet(ShoppingLists)
