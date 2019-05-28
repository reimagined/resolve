import React from 'react'
import { Platform, KeyboardAvoidingView, StyleSheet, View } from 'react-native'
import { Footer, Input, Label } from 'native-base'
import uuid from 'uuid/v4'

const styles = StyleSheet.create({
  footer: {
    height: 85
  },
  container: {
    width: '100%',
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15
  },
  subContainer: {
    flexDirection: 'row',
    flex: 1
  },
  label: {
    paddingLeft: 5,
    fontSize: 16,
    color: Platform.select({
      android: '#fff',
      ios: '#000'
    })
  },
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: '#000',
    backgroundColor: '#fff'
  }
})

class ShoppingListCreator extends React.PureComponent {
  state = {
    text: ''
  }

  updateText = text => {
    this.setState({
      text
    })
  }

  createShoppingList = () => {
    this.props.createShoppingList(uuid(), { name: this.state.text })
    this.setState({
      text: ''
    })
  }

  render() {
    return (
      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
        <Footer style={styles.footer}>
          <View style={styles.container}>
            <Label style={styles.label}>Shopping list name:</Label>
            <View style={styles.subContainer}>
              <Input
                style={styles.input}
                value={this.state.text}
                onChangeText={this.updateText}
                onSubmitEditing={this.createShoppingList}
                onEndEditing={this.createShoppingList}
                returnKeyType="done"
                returnKeyLabel="done"
              />
            </View>
          </View>
        </Footer>
      </KeyboardAvoidingView>
    )
  }
}

export default ShoppingListCreator
