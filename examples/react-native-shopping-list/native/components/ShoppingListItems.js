import React from 'react'
import { Icon, Left, List, ListItem, Right, Text } from "native-base";
import { StyleSheet, TouchableOpacity } from "react-native";

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

class ShoppingListItems extends React.PureComponent {
  render() {
    const { items } = this.props
  
    return (
      <List>
        {items.map(({ id, name }, index) => (
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

export default ShoppingListItems