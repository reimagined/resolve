import React from 'react'
import { List, ListItem, Text, Left, Right, Icon, Button } from 'native-base'
import { StyleSheet, TouchableHighlight } from 'react-native'

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    padding: 0,
    width: 40,
    height: 40,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    margin: 0,
    padding: 0
  }
})

class ShoppingLists extends React.PureComponent {
  onShare = id => {
    this.props.navigate('ShoppingList', {
      id
    })
  }

  onRemove = id => {
    console.log(id)
  }

  render() {
    const { lists, navigate } = this.props

    return (
      <List>
        {lists.map(({ id, name }) => (
          <ListItem key={id}>
            <Left>
              <Text>{`/${id}` + ' ' + name}</Text>
            </Left>
            <Right>
              <TouchableHighlight style={styles.button}>
                <Icon
                  style={styles.icon}
                  name="share-alt"
                  type="FontAwesome"
                  onPress={this.onShare.bind(this, id)}
                />
              </TouchableHighlight>
              <TouchableHighlight style={styles.button}>
                <Icon
                  style={styles.icon}
                  name="trash"
                  type="FontAwesome"
                  onPress={this.onRemove.bind(this, id)}
                />
              </TouchableHighlight>
            </Right>
          </ListItem>
        ))}
      </List>
    )
  }
}

export default ShoppingLists
