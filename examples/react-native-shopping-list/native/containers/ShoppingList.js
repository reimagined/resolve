import React from 'react'
import {
  Container,
  Header,
  Title,
  Content,
  Footer,
  FooterTab,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Text, Form, Label, Input, Item
} from "native-base";
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { connectViewModel } from '../resolve/resolve-redux'
import requiredAuth from '../decorators/requiredAuth'
import ShoppingItemCreator from '../components/ShoppingItemCreator'
import ShoppingListPanel from '../components/ShoppingListPanel'
import ShoppingListItems from '../components/ShoppingListItems'

export class ShoppingList extends React.PureComponent {
  render() {
    const { aggregateId, data, navigation, createShoppingItem } = this.props;
  
    return (
      <Container padder>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Shopping List</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <ShoppingListPanel
            navigate={navigation.navigate}
            aggregateId={aggregateId}
            name={data.name}
          />
          <ShoppingListItems
            items={data.list}
          />
        </Content>
        <ShoppingItemCreator
          createShoppingItem={this.props.createShoppingItem}
        />
      </Container>
    )
  }
}

export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.navigation.state.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.navigation.state.params.id

  return {
    jwt: state.jwt,
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectViewModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ShoppingList)
  )
)
