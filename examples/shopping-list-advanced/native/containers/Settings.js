import React from 'react'
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Label,
  Input
} from 'native-base'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { StyleSheet } from 'react-native'

import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import requiredAuth from '../decorators/required-auth'

const styles = StyleSheet.create({
  label: {
    paddingLeft: 5,
    fontSize: 16,
    color: '#575757'
  },
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 10
  }
})

export class Settings extends React.PureComponent {
  state = {}
  updateText = text => {
    this.setState({
      text
    })
  }

  updateUserName = () => {
    this.props.updateUserName(this.props.id, {
      username: this.state.text
    })
  }

  render() {
    const { isLoading, data } = this.props
    if (isLoading || data == null) {
      return null
    }

    const { id, username } = data
    let { text } = this.state

    if (text == null) {
      this.updateText(username)
      text = username
    }

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Settings</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <Label style={styles.label}>Username:</Label>
          <Input
            style={styles.input}
            value={text}
            onChangeText={this.updateText}
            onSubmitEditing={this.updateUserName}
            onBlur={this.updateUserName}
          />
          <Label style={styles.label}>User Id:</Label>
          <Input style={styles.input} value={id} multiline disabled />
        </Content>
      </Container>
    )
  }
}

export const mapStateToOptions = state => ({
  readModelName: 'ShoppingLists',
  resolverName: 'user',
  resolverArgs: {
    id: state.jwt.id
  }
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      createShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingList'
      ),
      renameShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'renameShoppingList'
      ),
      removeShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingList'
      ),
      createShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingItem'
      ),
      toggleShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'toggleShoppingItem'
      ),
      removeShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingItem'
      )
    },
    dispatch
  )

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      null,
      mapDispatchToProps
    )(Settings)
  )
)
