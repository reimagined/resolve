import React from 'react'
import { List, ListItem, Text, Left, Right, Icon, Button, Picker } from 'native-base'
import { StyleSheet, TouchableOpacity, UIManager, findNodeHandle } from 'react-native'

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
    fontSize: 24
  },
  picker: {
    width: '100%'
  }
})

const actions = ['Share', 'Remove']

class ShoppingLists extends React.PureComponent {
  onSelectError = () => {}
  
  onSelectComplete = (id, type, index) => {
    if (type === 'itemSelected') {
      switch (actions[index]) {
        case 'Share':
          this.props.navigate('ShareForm', { id })
        break;
        case 'Remove':
          this.props.removeShoppingList(id)
        break;
        default:
      }
    }
  }

  onRemove = id => {
    UIManager.showPopupMenu(
      findNodeHandle(this.refs[`more-${id}`]),
      actions,
      this.onSelectError,
      this.onSelectComplete.bind(this, id)
    )
  }
  

  render() {
    const { lists, navigate } = this.props

    return (
      <List>
        {lists.map(({ id, name }, index) => (
          <ListItem key={id}>
            <Left>
              <Text>
                {`${(index+1)}. `}
                {name}
              </Text>
            </Left>
            <Right>
              <TouchableOpacity
                style={styles.button}
                ref={`more-${id}`}
                onPress={this.onRemove.bind(this, id)}
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

export default ShoppingLists
