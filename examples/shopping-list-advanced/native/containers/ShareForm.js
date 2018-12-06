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
  Input,
  Text
} from 'native-base'
import { connect } from 'react-redux'
import { View, StyleSheet } from 'react-native'

import requiredAuth from '../decorators/required-auth'

import FindUsers from './FindUsers'

const styles = StyleSheet.create({
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D5DC',
    marginBottom: 10,
    paddingLeft: 5,
    paddingRight: 5,
    height: 50
  },
  inputText: {
    fontSize: 17,
    lineHeight: 50
  },
  label: {
    paddingLeft: 10,
    fontSize: 16,
    color: '#575757'
  }
})

export class ShareForm extends React.PureComponent {
  state = {
    query: ''
  }

  updateQuery = text => {
    this.setState({
      query: text
    })
  }

  redirectToShoppingList = () => {
    this.props.navigation.navigate('ShoppingList', {
      id: this.props.shoppingListId
    })
  }

  render() {
    const { shoppingListId, shoppingListName } = this.props
    const { query } = this.state

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Share</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <Label style={styles.label} onPress={this.redirectToShoppingList}>
            Shopping list name:
          </Label>
          <View style={styles.input}>
            <Text
              style={styles.inputText}
              onPress={this.redirectToShoppingList}
            >
              {shoppingListName}
            </Text>
          </View>
          <Label style={styles.label}>Find users:</Label>
          <Input
            style={styles.input}
            value={query}
            onChangeText={this.updateQuery}
          />
          <FindUsers shoppingListId={shoppingListId} query={query} />
        </Content>
      </Container>
    )
  }
}

export const mapStateToProps = (
  state,
  {
    navigation: {
      state: {
        params: { id }
      }
    }
  }
) => ({
  shoppingListId: id,
  shoppingListName: state.optimisticSharings.name
})

export default requiredAuth(connect(mapStateToProps)(ShareForm))
