import { findNodeHandle, StyleSheet, TouchableOpacity, UIManager, View } from "react-native";
import { Icon, Input, Item, Label, Left, Right, Form } from "native-base";
import { Act} from 'expo'
import React from "react";
import { connectActionSheet } from "@expo/react-native-action-sheet";

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
    marginRight: 10,
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
  },
  form: {
    flex: 1,
    flexGrow: 1,
    alignSelf: 'stretch'
  },
  input: {

  }
})

const options = ['Share', 'Remove']

class ShoppingListPanel extends React.PureComponent {
  state = {
    name: this.props.name
  }
  
  onMenuItemSelect = (index) => {
    switch (options[index]) {
      case 'Share':
        this.props.navigate('ShareForm', { id: this.props.aggregateId })
        break
      case 'Remove':
        this.props.removeShoppingList(this.props.aggregateId)
        break
      default:
    }
  }
  
  onMenuPress = () => {
    this.props.showActionSheetWithOptions({
        options
      },
      this.onMenuItemSelect
    );
  }
  
  updateName = (name) => {
    this.setState({
      name
    })
  }
  
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.subContainer}>
       
          <Form style={styles.form}>
            <Item stackedLabel>
              <Label>Shopping list name</Label>
              <Input
                style={styles.input}
                value={this.state.name}
                onChangeText={this.updateName}
              />
            </Item>
          </Form>
    
          <TouchableOpacity
            style={styles.button}
            ref={`more`}
            onPress={this.onMenuPress}
          >
            <Icon
              style={styles.icon}
              name="ellipsis-v"
              type="FontAwesome"
            />
          </TouchableOpacity>
  
        </View>
      </View>
    )
  }
}

export default connectActionSheet(ShoppingListPanel)


