import React from 'react'
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Icon, Left, List, ListItem, Right, Button, Text } from "native-base";


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  text: {
    width: 0,
    flexGrow: 1,
    flex: 1
  }
})


class UserList extends React.PureComponent {
  onPressButton = (userId, username) => {
    this.props.onPressButton(userId, username)
  }
  
  render() {
    const {
      buttonText,
      users,
    } = this.props

    if (users.length === 0) {
      return (
        <View>
          <Text>
            Users not found
          </Text>
        </View>
      )
    }
  
    return (
      <List>
        {users.map(({ id, username }, index) => (
          <ListItem key={id}>
            <View style={styles.container}>
              <Text style={styles.text}>
                {`${index + 1}. `}
                {username}
              </Text>
              <Button success onPress={this.onPressButton.bind(this, id, username)}>
                <Text numberOfLines={1}>
                {buttonText}
                </Text>
              </Button>
            </View>
          </ListItem>
        ))}
      </List>
    )
  }
}

export default UserList