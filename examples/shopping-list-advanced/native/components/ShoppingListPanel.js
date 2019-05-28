import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Icon, Input, Label } from 'native-base'
import { connectActionSheet } from '@expo/react-native-action-sheet'

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  subContainer: {
    flexDirection: 'row',
    flex: 1
  },
  icon: {
    margin: 0,
    padding: 0,
    fontSize: 24,
    width: 50,
    color: '#000',
    textAlign: 'center'
  },
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  label: {
    paddingLeft: 5,
    fontSize: 16,
    color: '#575757'
  }
})

const options = ['Share', 'Remove', 'Cancel']

class ShoppingListPanel extends React.PureComponent {
  state = {
    name: this.props.name
  }

  onMenuItemSelect = index => {
    switch (options[index]) {
      case 'Share':
        this.props.navigate('ShareForm', { id: this.props.aggregateId })
        break
      case 'Remove':
        this.props.removeShoppingList(this.props.aggregateId, {})
        break
      default:
    }
  }

  onMenuPress = () => {
    this.props.showActionSheetWithOptions(
      {
        options
      },
      this.onMenuItemSelect,
      2
    )
  }

  updateName = name => {
    this.setState({
      name
    })
  }

  renameShoppingList = () => {
    this.props.renameShoppingList(this.props.aggregateId, {
      name: this.state.name
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Label style={styles.label}>Shopping list name:</Label>
        <View style={styles.subContainer}>
          <Input
            style={styles.input}
            value={this.state.name}
            onChangeText={this.updateName}
            onSubmitEditing={this.renameShoppingList}
            onEndEditing={this.renameShoppingList}
            returnKeyType="done"
            returnKeyLabel="done"
          />
          <Icon
            style={styles.icon}
            name="ellipsis-v"
            type="FontAwesome"
            onPress={this.onMenuPress}
          />
        </View>
      </View>
    )
  }
}

export default connectActionSheet(ShoppingListPanel)
